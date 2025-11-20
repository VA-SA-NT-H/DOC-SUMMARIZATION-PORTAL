import re
import logging
from typing import Tuple

logger = logging.getLogger(__name__)

class TextPreprocessor:
    """Text preprocessing utilities for document summarization"""

    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and normalize text for summarization"""
        if not text or not text.strip():
            return ""

        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)

        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)\[\]\{\}\"\']', ' ', text)

        # Fix spacing around punctuation
        text = re.sub(r'\s+([.,!?;:])', r'\1', text)

        # Remove excessive line breaks
        text = re.sub(r'\n+', '\n', text)

        # Strip leading/trailing whitespace
        text = text.strip()

        return text

    @staticmethod
    def truncate_text(text: str, max_length: int = 1024) -> str:
        """Truncate text to maximum length for model input"""
        if len(text) <= max_length:
            return text

        # Try to truncate at sentence boundary
        sentences = re.split(r'[.!?]+', text)
        truncated = ""

        for sentence in sentences:
            if len(truncated + sentence) <= max_length - 1:
                truncated += sentence + "."
            else:
                break

        # If no sentences fit, truncate at word boundary
        if not truncated:
            words = text.split()
            truncated = ""
            for word in words:
                if len(truncated + word + " ") <= max_length:
                    truncated += word + " "
                else:
                    break

        return truncated.strip()

    @staticmethod
    def calculate_target_length(original_length: int, summary_ratio: float) -> int:
        """Calculate target summary length based on ratio"""
        target_length = int(original_length * summary_ratio)

        # Ensure minimum and maximum reasonable lengths
        target_length = max(50, min(target_length, 512))

        return target_length

    @staticmethod
    def prepare_for_summarization(text: str, summary_ratio: float) -> Tuple[str, int, int]:
        """Prepare text for summarization and return processed text with lengths"""
        # Clean text
        cleaned_text = TextPreprocessor.clean_text(text)

        if not cleaned_text:
            raise ValueError("Text is empty after cleaning")

        original_length = len(cleaned_text)
        target_length = TextPreprocessor.calculate_target_length(original_length, summary_ratio)

        # Truncate if too long for model
        max_model_input = 1024  # Typical for most models
        if len(cleaned_text) > max_model_input:
            cleaned_text = TextPreprocessor.truncate_text(cleaned_text, max_model_input)

        return cleaned_text, original_length, target_length

    @staticmethod
    def validate_summary_request(text: str, summary_ratio: float) -> bool:
        """Validate summarization request parameters"""
        if not text or len(text.strip()) < 50:
            raise ValueError("Text must be at least 50 characters long")

        if not 0.1 <= summary_ratio <= 0.5:
            raise ValueError("Summary ratio must be between 0.1 and 0.5")

        return True