from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

class SummarizeRequest(BaseModel):
    text: str = Field(..., min_length=50, description="Text to summarize")
    summary_ratio: float = Field(..., ge=0.1, le=0.5, description="Summary ratio between 0.1 and 0.5")
    model_name: Optional[str] = Field(default="facebook/bart-large-cnn", description="Model name to use")

class SummarizeResponse(BaseModel):
    summary_text: str
    model_used: str
    processing_time_ms: int
    confidence_score: float
    original_length: int
    summary_length: int

class HealthResponse(BaseModel):
    status: str
    models_loaded: list[str]
    memory_usage_mb: float

# Chat-related schemas
class ChatMessage(BaseModel):
    id: str
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime
    conversation_id: Optional[str] = None

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User message")
    summary_id: str = Field(..., description="Summary ID for context")
    conversation_id: Optional[str] = Field(default=None, description="Conversation ID for persistence")

class ChatResponse(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ConversationCreate(BaseModel):
    summary_id: str
    title: str
    user_id: str

class ConversationResponse(BaseModel):
    id: str
    summary_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    is_persistent: bool