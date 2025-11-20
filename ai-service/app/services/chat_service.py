import logging
import json
import uuid
from typing import List, Dict, AsyncGenerator, Optional
from datetime import datetime
from app.schemas import ChatMessage, ChatRequest
from app.models import model_manager
from app.preprocessing import TextPreprocessor

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        self.active_sessions = {}  # Track conversation sessions in memory

    async def handle_chat_message(
        self,
        request: ChatRequest,
        conversation_history: List[ChatMessage] = None
    ) -> AsyncGenerator[str, None]:
        """
        Handle a chat message with summary context and generate streaming AI response
        """
        try:
            # Get conversation context
            context = await self._prepare_context(request.summary_id, conversation_history)

            # Generate AI response with full context
            async for response_chunk in self._generate_ai_response(request.message, context):
                yield response_chunk

        except Exception as e:
            logger.error(f"Error handling chat message: {str(e)}")
            yield f"ERROR: {str(e)}"

    async def _prepare_context(self, summary_id: str, conversation_history: List[ChatMessage] = None) -> str:
        """
        Prepare context including both summary and full document content
        """
        try:
            # In a real implementation, this would fetch from database
            # For now, we'll simulate the context structure
            context_parts = [
                "You are an AI assistant helping a user understand a document summary.",
                "You have access to both the summary and the full document content.",
                "Provide helpful, accurate answers about the document content.",
                "If you don't have specific information, say so clearly.",
                ""
            ]

            # Add conversation history if available
            if conversation_history:
                context_parts.append("Recent conversation:")
                for msg in conversation_history[-5:]:  # Last 5 messages for context
                    context_parts.append(f"{msg.role}: {msg.content}")
                context_parts.append("")

            # Add summary context (this would be fetched from database)
            context_parts.append("Document Summary Context:")
            context_parts.append(f"Summary ID: {summary_id}")
            # In real implementation, fetch actual summary and document content here
            context_parts.append("[Summary content would be loaded here]")
            context_parts.append("[Full document content would be available here]")

            return "\n".join(context_parts)

        except Exception as e:
            logger.error(f"Error preparing context: {str(e)}")
            return "Error preparing context. Please try again."

    async def _generate_ai_response(self, user_message: str, context: str) -> AsyncGenerator[str, None]:
        """
        Generate AI response using the existing summarization model with chat context
        """
        try:
            # Prepare prompt with context
            full_prompt = f"""
{context}

User: {user_message}

Assistant: """

            # Use the existing model for text generation
            # In a real implementation, you might want to use a dedicated chat model
            summarizer = model_manager.get_summarizer()

            # Generate response (this is a simplified approach)
            # In production, you'd want a proper conversational AI model
            response = summarizer(
                full_prompt,
                max_length=200,  # Shorter responses for chat
                min_length=20,
                do_sample=True,
                temperature=0.7,
                early_stopping=True
            )

            # Extract and clean the response
            ai_response = response[0]['summary_text'].strip()
            ai_response = TextPreprocessor.clean_text(ai_response)

            # Remove any prefix that might include the original prompt
            if "Assistant:" in ai_response:
                ai_response = ai_response.split("Assistant:")[-1].strip()

            # Simulate streaming by yielding the response in chunks
            words = ai_response.split()
            current_chunk = ""

            for i, word in enumerate(words):
                current_chunk += word + " "

                # Yield every 5 words or at the end
                if (i + 1) % 5 == 0 or i == len(words) - 1:
                    yield current_chunk
                    current_chunk = ""

        except Exception as e:
            logger.error(f"Error generating AI response: {str(e)}")
            yield f"I apologize, but I encountered an error while generating a response: {str(e)}"

    def create_conversation_session(self, summary_id: str) -> str:
        """
        Create a new conversation session
        """
        session_id = str(uuid.uuid4())
        self.active_sessions[session_id] = {
            "summary_id": summary_id,
            "created_at": datetime.now(),
            "messages": []
        }
        return session_id

    def add_message_to_session(self, session_id: str, message: ChatMessage):
        """
        Add a message to a conversation session
        """
        if session_id in self.active_sessions:
            self.active_sessions[session_id]["messages"].append(message)

    def get_session_messages(self, session_id: str) -> List[ChatMessage]:
        """
        Get all messages from a conversation session
        """
        if session_id in self.active_sessions:
            return self.active_sessions[session_id]["messages"]
        return []

    def end_conversation_session(self, session_id: str):
        """
        End a conversation session
        """
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]

# Global chat service instance
chat_service = ChatService()