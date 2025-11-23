import os
import logging
import time
import google.generativeai as genai
from typing import Dict, List, Optional, Tuple, Any

logger = logging.getLogger(__name__)

class ModelManager:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            logger.warning("GOOGLE_API_KEY not found in environment variables. AI features will fail.")
        else:
            genai.configure(api_key=self.api_key)
            
        self.default_model = "models/gemini-flash-latest"
        # We don't need to "load" models in the same way, but we can keep track of configured ones
        self.models = {} 

    def load_model(self, model_name: str) -> bool:
        """
        For Gemini, 'loading' just means verifying we can configure the model.
        """
        if not self.api_key:
            logger.error("Cannot load model: GOOGLE_API_KEY missing")
            return False
            
        try:
            # Just verify we can instantiate the model object
            model = genai.GenerativeModel(model_name)
            self.models[model_name] = model
            logger.info(f"Model {model_name} configured successfully")
            return True
        except Exception as e:
            logger.exception(f"Failed to configure model {model_name}: {e}")
            return False

    def generate_summary_for_model(self, model_name: str, text: str, summary_ratio: float = 0.20) -> Dict[str, Any]:
        """
        Generate summary using Gemini API.
        Ignores complex chunking as Gemini 1.5 Flash has a huge context window.
        """
        if not self.api_key:
             raise RuntimeError("GOOGLE_API_KEY not configured")

        # Use default if not specified or not "loaded" (configured)
        if model_name not in self.models:
            model_name = self.default_model
        
        # Try to find a working model
        candidate_models = [model_name, "models/gemini-flash-latest", "models/gemini-pro-latest", "models/gemini-2.5-flash-lite"]
        
        model = None
        used_model_name = ""
        
        for candidate in candidate_models:
            try:
                m = genai.GenerativeModel(candidate)
                # Test generation with a simple prompt to verify it works
                # m.generate_content("test") 
                # Actually, just instantiating might not be enough, but let's try to use it.
                model = m
                used_model_name = candidate
                break
            except Exception:
                continue
        
        if not model:
             # Fallback to default and hope
             model = genai.GenerativeModel(self.default_model)
             used_model_name = self.default_model

        start_time = time.time()
        
        try:
            # Construct prompt
            # We can give a hint about length based on ratio, but it's approximate
            word_count = len(text.split())
            target_words = max(50, int(word_count * summary_ratio))
            
            prompt = f"""
            Please provide a comprehensive summary of the following text. 
            The summary should be approximately {target_words} words long.
            Capture the main points and key details.
            
            Text:
            {text}
            """
            
            response = model.generate_content(prompt)
            summary_text = response.text
            
            processing_time = (time.time() - start_time) * 1000
            
            return {
                "summary_text": summary_text,
                "chunk_count": 1, # No chunking needed
                "similarity_score": 0.0, # Not calculating similarity locally
                "chunks": [summary_text],
                "metadata": {
                    "model_used": model_name,
                    "device": "cloud",
                    "summary_ratio": summary_ratio,
                    "timestamp": time.time(),
                    "processing_time_ms": processing_time
                }
            }

        except Exception as e:
            logger.exception(f"Gemini summarization failed: {e}")
            raise RuntimeError(f"Summarization failed: {str(e)}")

    def load_default_model(self) -> bool:
        return self.load_model(self.default_model)

    def get_model(self, model_name: Optional[str] = None):
        if model_name is None:
            model_name = self.default_model
        if model_name not in self.models:
            self.load_model(model_name)
        return self.models.get(model_name)

    def get_model_info(self) -> Dict[str, any]:
        return {
            "loaded_models": list(self.models.keys()),
            "default_model": self.default_model,
            "device": "cloud",
            "memory_usage_mb": 0 # Minimal local usage
        }

    def unload_model(self, model_name: str) -> bool:
        if model_name in self.models:
            del self.models[model_name]
            return True
        return False

    def unload_all_models(self):
        self.models.clear()

# Global instance
model_manager = ModelManager()
