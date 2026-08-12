"""
Token Counter - Estimates token usage for AI API calls
"""
import re
from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class TokenEstimate:
    """Token usage estimate"""
    text_tokens: int
    image_tokens: int
    total_tokens: int
    estimated_cost_usd: float


class TokenCounter:
    """
    Estimates token usage for AI model API calls.
    Provides cost estimation for different models.
    """
    
    # Approximate pricing per 1M tokens.
    PRICING = {
        "google/gemini-3.1-flash-lite-preview": {"input": 0.25, "output": 1.50},
        "gpt-4o": {"input": 2.50, "output": 10.00},
        "gpt-4o-mini": {"input": 0.15, "output": 0.60},
        "gpt-4-turbo": {"input": 10.00, "output": 30.00},
        "claude-3-5-sonnet": {"input": 3.00, "output": 15.00},
        "claude-3-opus": {"input": 15.00, "output": 75.00},
        "claude-3-haiku": {"input": 0.25, "output": 1.25},
    }
    
    # Image token estimates by detail level
    IMAGE_TOKENS = {
        "low": 85,       # 512x512 low detail
        "high": 765,     # 512x512 high detail (base)
        "high_large": 1105,  # Larger images with high detail
    }
    
    def __init__(self, model: str = "google/gemini-3.1-flash-lite-preview"):
        """
        Initialize the token counter.
        
        Args:
            model: The model to estimate for
        """
        self.model = model
    
    def count_text_tokens(self, text: str) -> int:
        """
        Estimate the number of tokens in a text string.
        
        This is an approximation - actual tokenization varies by model.
        Uses a simple heuristic of ~4 characters per token.
        
        Args:
            text: The text to count tokens for
            
        Returns:
            Estimated token count
        """
        if not text:
            return 0
        
        # Simple heuristic: ~4 characters per token on average
        # This is a reasonable approximation for English text
        char_count = len(text)
        
        # Adjust for whitespace (tokens often include leading space)
        word_count = len(text.split())
        
        # Use a weighted average
        estimate = (char_count / 4 + word_count) / 2
        
        return max(1, int(estimate))
    
    def count_image_tokens(
        self,
        width: int,
        height: int,
        detail: str = "high"
    ) -> int:
        """
        Estimate tokens for an image.
        
        Based on OpenAI's vision token calculation.
        
        Args:
            width: Image width in pixels
            height: Image height in pixels
            detail: "low" or "high"
            
        Returns:
            Estimated token count
        """
        if detail == "low":
            return self.IMAGE_TOKENS["low"]
        
        # High detail calculation (OpenAI method)
        # Images are scaled to fit in 2048x2048
        max_dim = max(width, height)
        if max_dim > 2048:
            scale = 2048 / max_dim
            width = int(width * scale)
            height = int(height * scale)
        
        # Then shortest side scaled to 768
        min_dim = min(width, height)
        if min_dim > 768:
            scale = 768 / min_dim
            width = int(width * scale)
            height = int(height * scale)
        
        # Count 512x512 tiles
        tiles_x = (width + 511) // 512
        tiles_y = (height + 511) // 512
        total_tiles = tiles_x * tiles_y
        
        # Each tile is 170 tokens, plus 85 base
        return 85 + (170 * total_tiles)
    
    def estimate_cost(
        self,
        input_tokens: int,
        output_tokens: int,
        model: Optional[str] = None
    ) -> float:
        """
        Estimate the cost of an API call.
        
        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            model: Model to estimate for (uses instance default if not specified)
            
        Returns:
            Estimated cost in USD
        """
        model = model or self.model
        pricing = self.PRICING.get(model, self.PRICING["google/gemini-3.1-flash-lite-preview"])
        
        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]
        
        return input_cost + output_cost
    
    def estimate_vision_call(
        self,
        prompt: str,
        image_width: int,
        image_height: int,
        expected_output_tokens: int = 500,
        image_detail: str = "high"
    ) -> TokenEstimate:
        """
        Estimate tokens and cost for a vision API call.
        
        Args:
            prompt: The text prompt
            image_width: Image width in pixels
            image_height: Image height in pixels
            expected_output_tokens: Expected response length
            image_detail: "low" or "high"
            
        Returns:
            TokenEstimate with breakdown and cost
        """
        text_tokens = self.count_text_tokens(prompt)
        image_tokens = self.count_image_tokens(image_width, image_height, image_detail)
        total_input = text_tokens + image_tokens
        
        cost = self.estimate_cost(total_input, expected_output_tokens)
        
        return TokenEstimate(
            text_tokens=text_tokens,
            image_tokens=image_tokens,
            total_tokens=total_input + expected_output_tokens,
            estimated_cost_usd=cost
        )
    
    def estimate_test_run(
        self,
        num_pages: int,
        actions_per_page: int = 5,
        image_width: int = 1280,
        image_height: int = 720
    ) -> TokenEstimate:
        """
        Estimate tokens and cost for a complete test run.
        
        Args:
            num_pages: Number of pages to analyze
            actions_per_page: Average actions per page
            image_width: Screenshot width
            image_height: Screenshot height
            
        Returns:
            TokenEstimate for the entire run
        """
        # Each page gets an initial analysis
        analysis_per_page = self.estimate_vision_call(
            "Analyze this page...",  # ~500 chars prompt
            image_width,
            image_height,
            expected_output_tokens=800
        )
        
        # Each action might need verification
        verification_per_action = self.estimate_vision_call(
            "Verify outcome...",  # ~300 chars
            image_width,
            image_height,
            expected_output_tokens=400
        )
        
        total_analyses = num_pages
        total_verifications = num_pages * actions_per_page
        
        total_text = (
            analysis_per_page.text_tokens * total_analyses +
            verification_per_action.text_tokens * total_verifications
        )
        total_image = (
            analysis_per_page.image_tokens * total_analyses +
            verification_per_action.image_tokens * total_verifications
        )
        total = total_text + total_image
        
        # Estimate output tokens
        total_output = (800 * total_analyses) + (400 * total_verifications)
        
        cost = self.estimate_cost(total, total_output)
        
        return TokenEstimate(
            text_tokens=total_text,
            image_tokens=total_image,
            total_tokens=total + total_output,
            estimated_cost_usd=cost
        )
