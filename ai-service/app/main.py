import logging
import time
import os
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.schemas import SummarizeRequest, SummarizeResponse, HealthResponse, ChatRequest
from app.models import model_manager
from app.preprocessing import TextPreprocessor
from app.services.chat_service import chat_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    logger.info("Starting AI Summarization Service")

    # Load default model
    if not model_manager.load_default_model():
        logger.error("Failed to load default model")
        raise RuntimeError("Could not initialize AI models")

    logger.info("AI Service started successfully")

    yield

    # Shutdown
    logger.info("Shutting down AI Service")
    model_manager.unload_all_models()

# Create FastAPI app
app = FastAPI(
    title="AI Document Summarization Service",
    description="FastAPI service for AI-based document summarization using HuggingFace Transformers",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        model_info = model_manager.get_model_info()
        return HealthResponse(
            status="healthy",
            models_loaded=model_info["loaded_models"],
            memory_usage_mb=model_info["memory_usage_mb"]
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unavailable")

@app.post("/summarize", response_model=SummarizeResponse)
async def summarize_text(request: SummarizeRequest):
    """Generate summary for given text"""
    try:
        # Validate request
        TextPreprocessor.validate_summary_request(request.text, request.summary_ratio)

        # Prepare text
        processed_text, original_length, target_length = TextPreprocessor.prepare_for_summarization(
            request.text, request.summary_ratio
        )

        logger.info(f"Processing summarization request: original_length={original_length}, target_length={target_length}")

        # Generate summary using Gemini
        summary_result = model_manager.generate_summary_for_model(
            request.model_name,
            processed_text,
            request.summary_ratio
        )

        response = SummarizeResponse(
            summary_text=summary_result["summary_text"],
            model_used=summary_result["metadata"]["model_used"],
            processing_time_ms=int(summary_result["metadata"]["processing_time_ms"]),
            confidence_score=0.9, # Mock confidence
            original_length=original_length,
            summary_length=len(summary_result["summary_text"])
        )

        logger.info(f"Summary generated successfully in {response.processing_time_ms}ms")
        return response

    except ValueError as e:
        logger.warning(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Summarization failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Summarization failed")

@app.get("/models")
async def list_models():
    """List available and loaded models"""
    model_info = model_manager.get_model_info()
    return {
        "loaded_models": model_info["loaded_models"],
        "default_model": model_info["default_model"],
        "available_models": list(model_manager.model_configs.keys()),
        "device": model_info["device"],
        "memory_usage_mb": model_info["memory_usage_mb"]
    }

@app.post("/models/{model_name}/load")
async def load_model(model_name: str):
    """Load a specific model"""
    if model_name not in model_manager.model_configs:
        raise HTTPException(status_code=404, detail=f"Model {model_name} not available")

    success = model_manager.load_model(model_name)
    if success:
        return {"message": f"Model {model_name} loaded successfully"}
    else:
        raise HTTPException(status_code=500, detail=f"Failed to load model {model_name}")

@app.delete("/models/{model_name}")
async def unload_model(model_name: str):
    """Unload a specific model"""
    success = model_manager.unload_model(model_name)
    if success:
        return {"message": f"Model {model_name} unloaded successfully"}
    else:
        raise HTTPException(status_code=404, detail=f"Model {model_name} not loaded")

# WebSocket endpoint for chat functionality
@app.websocket("/ws/chat/{summary_id}")
async def websocket_chat_endpoint(websocket: WebSocket, summary_id: str):
    """WebSocket endpoint for real-time chat about document summaries"""
    await websocket.accept()

    # Create conversation session
    session_id = chat_service.create_conversation_session(summary_id)

    try:
        # Send welcome message
        await websocket.send_json({
            "type": "system",
            "message": "Connected to AI chat assistant. Ask me anything about this document!"
        })

        while True:
            # Receive user message
            data = await websocket.receive_json()

            if data.get("type") == "message":
                user_message = data.get("message", "")

                if not user_message.strip():
                    await websocket.send_json({
                        "type": "error",
                        "message": "Message cannot be empty"
                    })
                    continue

                # Create chat request
                chat_request = ChatRequest(
                    message=user_message,
                    summary_id=summary_id
                )

                # Send typing indicator
                await websocket.send_json({
                    "type": "typing",
                    "status": True
                })

                try:
                    # Generate AI response
                    response_text = ""
                    async for chunk in chat_service.handle_chat_message(chat_request):
                        response_text += chunk

                    # Send AI response
                    await websocket.send_json({
                        "type": "message",
                        "role": "assistant",
                        "message": response_text.strip(),
                        "timestamp": time.time()
                    })

                except Exception as e:
                    logger.error(f"Error generating chat response: {str(e)}")
                    await websocket.send_json({
                        "type": "error",
                        "message": "Failed to generate AI response. Please try again."
                    })

                # Stop typing indicator
                await websocket.send_json({
                    "type": "typing",
                    "status": False
                })

            elif data.get("type") == "ping":
                # Handle keep-alive
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        logger.info(f"Client disconnected from chat session {session_id}")
        chat_service.end_conversation_session(session_id)
    except Exception as e:
        logger.error(f"Error in WebSocket chat: {str(e)}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": "Connection error occurred"
            })
        except:
            pass  # Connection might already be closed
        chat_service.end_conversation_session(session_id)

def calculate_confidence_score(summary_text: str, original_text: str) -> float:
    """Calculate a mock confidence score (in real implementation, this could be based on various metrics)"""
    # Simple heuristic based on length ratio and content
    ratio = len(summary_text) / len(original_text)

    # Base confidence on appropriate length reduction
    if 0.1 <= ratio <= 0.5:
        base_confidence = 0.8
    else:
        base_confidence = 0.6

    # Add some randomness to simulate model confidence variation
    import random
    confidence = base_confidence + random.uniform(-0.1, 0.1)

    return max(0.0, min(1.0, confidence))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)