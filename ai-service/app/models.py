import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
import logging
import time
import psutil
import os
from typing import Dict, List, Optional, Tuple, Any
import math
from difflib import SequenceMatcher

logger = logging.getLogger(__name__)

def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def chunk_text(text: str, max_chunk_tokens: int = 800, tokenizer: Optional[AutoTokenizer] = None) -> List[str]:
    """
    Token-aware chunker. If tokenizer provided, uses token count to chunk; otherwise falls back to paragraph/word chunking.
    Returns list of text chunks (strings).
    """
    if tokenizer is None:
        # Fallback: split by paragraphs keeping roughly max_chunk_tokens words per chunk
        paras = [p.strip() for p in text.split("\n\n") if p.strip()]
        chunks = []
        cur = []
        cur_len = 0
        for p in paras:
            l = len(p.split())
            if cur_len + l > max_chunk_tokens and cur:
                chunks.append(" ".join(cur))
                cur = [p]
                cur_len = l
            else:
                cur.append(p)
                cur_len += l
        if cur:
            chunks.append(" ".join(cur))
        return chunks

    # Tokenizer-aware splitting
    tokens = tokenizer.encode(text, add_special_tokens=False)
    if len(tokens) <= max_chunk_tokens:
        return [text]

    chunks = []
    start = 0
    total = len(tokens)
    while start < total:
        end = min(start + max_chunk_tokens, total)
        # decode tokens to text for this chunk
        chunk_text = tokenizer.decode(tokens[start:end], skip_special_tokens=True, clean_up_tokenization_spaces=True)
        chunks.append(chunk_text.strip())
        start = end
    return chunks


class ModelManager:
    def __init__(self):
        # store as dict of model_name -> (tokenizer, model, summarizer_pipeline, device)
        self.models: Dict[str, Tuple[AutoTokenizer, AutoModelForSeq2SeqLM, Any, str]] = {}
        self.default_model = "facebook/bart-large-cnn"
        self.model_configs = {
            "facebook/bart-large-cnn": {
                # these are default generation config values; will be applied per-call as well
            },
            "sshleifer/distilbart-cnn-12-6": {},
            "t5-small": {}
        }

    def load_model(self, model_name: str) -> bool:
        """Load a model and tokenizer into memory and cache the summarization pipeline."""
        try:
            logger.info(f"Loading model: {model_name}")

            if model_name in self.models:
                logger.info(f"Model {model_name} already loaded")
                return True

            start_time = time.time()

            # Load tokenizer
            tokenizer = AutoTokenizer.from_pretrained(model_name)

            # Load model
            model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

            # Move to GPU if available
            device_str = "cuda" if torch.cuda.is_available() else "cpu"
            device_id = 0 if device_str == "cuda" else -1
            model.to(device_str)

            # Create summarization pipeline and store it so we don't recreate later
            summarizer = pipeline(
                "summarization",
                model=model,
                tokenizer=tokenizer,
                device=device_id
            )

            # store tuple in a clear order: tokenizer, model, pipeline, device
            self.models[model_name] = (tokenizer, model, summarizer, device_str)

            load_time = time.time() - start_time
            logger.info(f"Model {model_name} loaded successfully in {load_time:.2f} seconds")

            return True

        except Exception as e:
            logger.exception(f"Failed to load model {model_name}: {e}")
            return False

    def generate_summary_for_model(self, model_name: str, text: str, summary_ratio: float = 0.20) -> Dict[str, Any]:
        """
        High-level summarization:
          - load model (if required),
          - token-aware chunking,
          - per-chunk summarization,
          - merge and final summarization pass,
          - similarity check and a fallback aggressive summarization if needed.

        Returns dict: { "summary_text": str, "chunk_count": int, "similarity_score": float, "chunks": [...], "metadata": {...} }
        """
        if model_name not in self.models:
            ok = self.load_model(model_name)
            if not ok:
                # fallback to default
                if model_name != self.default_model:
                    logger.warning(f"Falling back to default model {self.default_model}")
                    if not self.load_model(self.default_model):
                        raise RuntimeError("Failed to load any summarization model")
                    model_name = self.default_model
                else:
                    raise RuntimeError("Failed to load summarization model")

        tokenizer, model, summarizer, device_str = self.models[model_name]

        # Determine chunk token limit conservatively based on common model sizes
        # For BART/T5-like models typical context ~1024-2048 tokens; keep chunk smaller
        max_chunk_tokens = 700

        # 1) Chunk text (use tokenizer-aware chunker)
        chunks = chunk_text(text, max_chunk_tokens=max_chunk_tokens, tokenizer=tokenizer)
        logger.info(f"Text split into {len(chunks)} chunk(s) for summarization (model={model_name})")

        # 2) Summarize each chunk (use stable deterministic params)
        chunk_summaries = []
        for idx, c in enumerate(chunks):
            original_words = max(1, len(c.split()))
            target_words = max(30, int(original_words * summary_ratio))
            min_len = max(20, int(target_words * 0.5))
            max_len = max(60, int(target_words * 1.6))

            try:
                out = summarizer(
                    c,
                    min_length=min_len,
                    max_length=max_len,
                    do_sample=False,
                    num_beams=4,
                    length_penalty=1.1,
                    early_stopping=True,
                    truncation=True
                )
                s = out[0].get("summary_text", "").strip()
            except Exception as e:
                logger.exception(f"Chunk summarization failed for chunk {idx}: {e}")
                s = " ".join(c.split()[:target_words]) + ("..." if len(c.split()) > target_words else "")

            chunk_summaries.append(s)

        # 3) Merge chunk summaries
        merged = "\n\n".join(chunk_summaries)

        # Final summarization pass: target lengths relative to merged length
        merged_word_count = max(1, len(merged.split()))
        final_min = max(40, int(merged_word_count * 0.12))
        final_max = max(120, int(merged_word_count * summary_ratio * 0.9 + 60))

        try:
            final_out = summarizer(
                merged,
                min_length=final_min,
                max_length=final_max,
                do_sample=False,
                num_beams=6,
                length_penalty=1.2,
                early_stopping=True,
                truncation=True
            )
            final_summary = final_out[0].get("summary_text", "").strip()
        except Exception as e:
            logger.exception(f"Final summarization pass failed: {e}")
            final_summary = merged if len(merged.split()) < final_max else " ".join(merged.split()[:final_max]) + "..."

        # 4) Similarity check and fallback aggressive pass if final_summary too similar to original
        sim_score = similarity(final_summary, text)
        logger.debug(f"Summary-to-source similarity: {sim_score:.3f}")
        if sim_score > 0.60:
            try:
                final_out2 = summarizer(
                    text,
                    min_length=40,
                    max_length=80,
                    do_sample=False,
                    num_beams=8,
                    length_penalty=2.0,
                    early_stopping=True,
                    truncation=True
                )
                final_summary = final_out2[0].get("summary_text", "").strip()
                sim_score = similarity(final_summary, text)
                logger.info(f"Used aggressive fallback summarization; new similarity {sim_score:.3f}")
            except Exception as e:
                logger.exception("Aggressive fallback summarization failed: {e}")

        # Return detailed info (helpful for frontend and logging)
        result = {
            "summary_text": final_summary,
            "chunk_count": len(chunks),
            "similarity_score": sim_score,
            "chunks": chunk_summaries,
            "metadata": {
                "model_used": model_name,
                "device": device_str,
                "summary_ratio": summary_ratio,
                "timestamp": time.time()
            }
        }
        return result

    def load_default_model(self) -> bool:
        return self.load_model(self.default_model)

    def get_summarizer(self, model_name: Optional[str] = None):
        if model_name is None:
            model_name = self.default_model
        if model_name not in self.models:
            if not self.load_model(model_name):
                if model_name != self.default_model and not self.load_model(self.default_model):
                    raise RuntimeError("Failed to load any summarization model")
                model_name = self.default_model
        return self.models[model_name][2]  # pipeline

    def get_model_info(self) -> Dict[str, any]:
        info = {
            "loaded_models": list(self.models.keys()),
            "default_model": self.default_model,
            "device": "cuda" if torch.cuda.is_available() else "cpu",
            "memory_usage_mb": self._get_memory_usage()
        }
        return info

    def _get_memory_usage(self) -> float:
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / 1024 / 1024

    def unload_model(self, model_name: str) -> bool:
        if model_name in self.models:
            # try to free GPU memory if possible
            try:
                _, model, _, _ = self.models[model_name]
                if torch.is_tensor(getattr(model, "device", None)):
                    pass
            except Exception:
                pass
            del self.models[model_name]
            logger.info(f"Model {model_name} unloaded")
            return True
        return False

    def unload_all_models(self):
        self.models.clear()
        logger.info("All models unloaded")


# Global instance
model_manager = ModelManager()
