import logging
import json
import uuid
import os
from typing import List, Dict, AsyncGenerator, Optional
from datetime import datetime
from app.schemas import ChatMessage, ChatRequest
from app.models import model_manager
import httpx

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        self.active_sessions = {}  # Track conversation sessions in memory
        # Map session_id to Gemini ChatSession object
        self.gemini_sessions = {}

    async def handle_chat_message(
        self,
        request: ChatRequest,
        conversation_history: List[ChatMessage] = None
    ) -> AsyncGenerator[str, None]:
        """
        Handle a chat message using Gemini chat session
        """
        try:
            # Create or retrieve Gemini chat session
            # We use a simple in-memory mapping for now. In production, this might need better state management.
            # For this simplified app, we might re-create the chat session if not found, 
            # but ideally we want to persist the chat object or history.
            
            # Since the frontend sends a new request each time but we want to maintain history,
            # we can either rely on the `conversation_history` passed in, or use our `active_sessions`.
            # The `conversation_history` from frontend is good.
            
            # Let's fetch the document content first if we haven't initialized this "context" yet.
            # But since we don't have a persistent session ID from the frontend (it sends summary_id),
            # we'll treat each request as potentially needing context.
            
            # Optimization: Check if we have an active Gemini session for this summary_id?
            # The frontend doesn't send a session ID, it sends summary_id. 
            # So multiple users on same summary would share state if we keyed by summary_id.
            # We should probably just rebuild the chat history for Gemini each time 
            # OR (better for this demo) just use a fresh generation with history included in prompt 
            # if we don't want to manage stateful Gemini objects.
            
            # However, Gemini `start_chat` is stateful.
            # Let's use the `conversation_history` to rebuild state if needed, 
            # or just use `generate_content` with the full history as context.
            
            # Strategy: Fetch document content -> Build full prompt with history -> Generate
            
            context = await self._prepare_context(request.summary_id)
            # Get model
            model = model_manager.get_model(model_manager.default_model)
            
            if not model:
                yield "ERROR: AI model not available"
                return

            # Construct the full chat prompt
            chat_prompt = f"{context}\n\n"
            
            if conversation_history:
                chat_prompt += "Conversation History:\n"
                for msg in conversation_history:
                    role = "User" if msg.role == "user" else "Model"
                    chat_prompt += f"{role}: {msg.content}\n"
            
            chat_prompt += f"\nUser: {request.message}\nModel:"

            # Streaming response
            response = model.generate_content(chat_prompt, stream=True)
            
            for chunk in response:
                if chunk.text:
                    yield chunk.text

        except Exception as e:
            logger.error(f"Error handling chat message: {str(e)}")
            yield f"ERROR: {str(e)}"

    async def _prepare_context(self, summary_id: str) -> str:
        """
        Prepare context including both summary and full document content
        """
        try:
            backend_url = os.getenv("BACKEND_URL", "http://backend:8080")
            api_key = os.getenv("INTERNAL_API_KEY", "")
            
            document_content = ""
            
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        f"{backend_url}/api/internal/documents/{summary_id}/content",
                        headers={"X-Internal-API-Key": api_key},
                        timeout=10.0
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        document_content = data.get("content", "")
                    else:
                        logger.error(f"Failed to fetch document content: {response.status_code}")
            except Exception as e:
                logger.error(f"Error fetching document content: {str(e)}")

            context = f"""
            You are an AI assistant helping a user understand a document.
            
            Document Content:
            {document_content[:100000]} 
            
            (Note: Content truncated if > 100k chars, but Gemini handles large context well)
            
            Please answer the user's question based on the document content above.
            """
            return context

        except Exception as e:
            logger.error(f"Error preparing context: {str(e)}")
            return "Error preparing context."

    def create_conversation_session(self, summary_id: str) -> str:
        session_id = str(uuid.uuid4())
        self.active_sessions[session_id] = {
            "summary_id": summary_id,
            "created_at": datetime.now(),
            "messages": []
        }
        return session_id

    def add_message_to_session(self, session_id: str, message: ChatMessage):
        if session_id in self.active_sessions:
            self.active_sessions[session_id]["messages"].append(message)

    def get_session_messages(self, session_id: str) -> List[ChatMessage]:
        if session_id in self.active_sessions:
            return self.active_sessions[session_id]["messages"]
        return []

    def end_conversation_session(self, session_id: str):
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]

# Global chat service instance
chat_service = ChatService()