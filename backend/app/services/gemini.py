import asyncio
import logging
import time
from typing import Optional, List, Dict, Any
from io import BytesIO
from PIL import Image
from google import genai
from google.genai import types

from app.config import settings
from app.utils.image import (
    base64_to_pil,
    bytes_to_base64,
    resize_image_if_needed
)

logger = logging.getLogger(__name__)


class GeminiService:
    """Service for interacting with Google Gemini API."""
    
    def __init__(self):
        """Initialize the Gemini service with API credentials."""
        try:
            self.client = genai.Client(api_key=settings.gemini_api_key)
            self.model_name = settings.model_name
            logger.info(f"Gemini service initialized with model: {self.model_name}")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            raise RuntimeError(f"Failed to initialize Gemini service: {str(e)}")
    
    async def generate_image(
        self,
        prompt: str,
        context_images: Optional[List[str]] = None,
        temperature: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Generate an image using Gemini API.
        
        Args:
            prompt: Text prompt for image generation
            context_images: Optional list of base64 encoded context images
            temperature: Generation temperature (0.0 to 2.0)
            
        Returns:
            Dictionary containing the generated image and metadata
        """
        start_time = time.time()
        
        try:
            # Prepare the content for the model
            contents = []
            
            # Add context images if provided
            if context_images:
                for img_base64 in context_images:
                    # Convert base64 to PIL and resize if needed
                    pil_image = base64_to_pil(img_base64)
                    pil_image = resize_image_if_needed(pil_image)
                    
                    # Convert back to bytes for Gemini
                    buffer = BytesIO()
                    pil_image.save(buffer, format='PNG')
                    buffer.seek(0)
                    
                    # Add image as inline data using the correct API
                    contents.append(types.Part.from_bytes(
                        data=buffer.getvalue(),
                        mime_type="image/png"
                    ))
                    
                logger.info(f"Added {len(context_images)} context images to prompt")
            
            # Add the text prompt
            contents.append(prompt)
            
            # Configure generation settings
            generation_config = {}
            if temperature is not None:
                generation_config['temperature'] = temperature
            
            # Generate content asynchronously
            logger.info(f"Generating image with prompt: {prompt[:100]}...")
            
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    **generation_config
                ) if generation_config else None
            )
            
            # Extract the generated image from response
            generated_image_data = None
            
            if response and response.candidates:
                candidate = response.candidates[0]
                if candidate.content and candidate.content.parts:
                    for part in candidate.content.parts:
                        if hasattr(part, 'inline_data') and part.inline_data:
                            generated_image_data = part.inline_data.data
                            break
            
            if not generated_image_data:
                raise ValueError("No image was generated in the response")
            
            # Convert to base64
            image_base64 = bytes_to_base64(generated_image_data)
            
            generation_time = time.time() - start_time
            
            # Prepare metadata
            metadata = {
                "generation_time": generation_time,
                "model_used": self.model_name,
                "prompt_length": len(prompt),
                "context_images_count": len(context_images) if context_images else 0,
                "temperature": temperature
            }
            
            logger.info(f"Successfully generated image in {generation_time:.2f} seconds")
            
            return {
                "success": True,
                "image": image_base64,
                "metadata": metadata
            }
            
        except Exception as e:
            logger.error(f"Error generating image: {e}")
            return {
                "success": False,
                "error": str(e),
                "metadata": {
                    "generation_time": time.time() - start_time,
                    "model_used": self.model_name
                }
            }
    
    async def health_check(self) -> bool:
        """
        Check if the Gemini service is healthy and accessible.
        
        Returns:
            True if service is healthy, False otherwise
        """
        try:
            # Try a simple API call to verify connectivity
            # Using a minimal prompt to check service availability
            test_prompt = "test"
            
            response = await asyncio.to_thread(
                self.client.models.generate_content,
                model=self.model_name,
                contents=test_prompt,
                config=types.GenerateContentConfig(
                    max_output_tokens=1,
                    temperature=0.1
                )
            )
            
            return response is not None
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Singleton instance
_gemini_service: Optional[GeminiService] = None


def get_gemini_service() -> GeminiService:
    """Get or create the Gemini service singleton."""
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service