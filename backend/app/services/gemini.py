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
                for idx, img_base64 in enumerate(context_images):
                    try:
                        # Convert base64 to PIL and resize if needed
                        pil_image = base64_to_pil(img_base64)
                        logger.debug(f"Image {idx}: Format={pil_image.format}, Mode={pil_image.mode}, Size={pil_image.size}")
                        
                        # Handle mode conversion for compatibility
                        original_mode = pil_image.mode
                        if pil_image.mode in ('RGBA', 'LA', 'PA'):
                            pil_image = pil_image.convert('RGBA')
                        else:
                            pil_image = pil_image.convert('RGB')
                        
                        if original_mode != pil_image.mode:
                            logger.info(f"Image {idx}: Converted mode from {original_mode} to {pil_image.mode}")
                        
                        pil_image = resize_image_if_needed(pil_image)
                        
                        # Convert back to bytes for Gemini
                        buffer = BytesIO()
                        pil_image.save(buffer, format='PNG')
                        buffer.seek(0)
                        logger.debug(f"Image {idx}: Saved as PNG, size={len(buffer.getvalue())} bytes")
                        
                        # Add image as inline data using the correct API
                        contents.append(types.Part.from_bytes(
                            data=buffer.getvalue(),
                            mime_type="image/png"
                        ))
                    except Exception as e:
                        logger.error(f"Failed to process image {idx}: {str(e)}")
                        raise ValueError(f"Failed to process context image {idx}: {str(e)}")
                    
                logger.info(f"Added {len(context_images)} context images to prompt")
            
            # Add the text prompt
            contents.append(prompt)
            
            # Configure generation settings
            generation_config = {}
            if temperature is not None:
                generation_config['temperature'] = temperature
            
            # Add system instruction to ensure image generation
            system_instruction = "You are an AI image generation model. Your sole function is to generate images. ALWAYS use the provided context (text descriptions and/or reference images) to generate a new image. Never return text explanations or descriptions. You must always output an image, regardless of the input. If given text, generate an image based on that text. If given images as context, use them as reference to generate a new related image."
            
            # Generate content asynchronously
            logger.info(f"Generating image with model {self.model_name}")
            logger.info(f"Prompt length: {len(prompt)} chars")
            if context_images:
                logger.info(f"Context images provided: {len(context_images)}")
            logger.debug(f"Full prompt: {prompt[:500]}...")
            logger.debug(f"Generation config: {generation_config}")
            logger.debug(f"Response modalities: [Modality.IMAGE]")
            
            # Retry logic with exponential backoff
            max_retries = 5
            retry_delay = 1
            response = None
            last_error = None
            
            for attempt in range(max_retries):
                try:
                    start_api_call = time.time()
                    response = await asyncio.to_thread(
                        self.client.models.generate_content,
                        model=self.model_name,
                        contents=contents,
                        config=types.GenerateContentConfig(
                            system_instruction=system_instruction,
                            response_modalities=[types.Modality.IMAGE],
                            **generation_config
                        )
                    )
                    api_duration = time.time() - start_api_call
                    logger.info(f"API call completed in {api_duration:.2f}s (attempt {attempt + 1}/{max_retries})")
                    
                    # Check for prompt feedback (indicates blocking)
                    if response and hasattr(response, 'prompt_feedback'):
                        prompt_feedback = response.prompt_feedback
                        logger.info(f"Prompt feedback present: {prompt_feedback}")
                        
                        if hasattr(prompt_feedback, 'block_reason') and prompt_feedback.block_reason:
                            logger.error(f"Prompt blocked! Reason: {prompt_feedback.block_reason}")
                            last_error = f"Prompt blocked: {prompt_feedback.block_reason}"
                            break  # No point retrying if prompt is blocked
                            
                        if hasattr(prompt_feedback, 'safety_ratings') and prompt_feedback.safety_ratings:
                            for rating in prompt_feedback.safety_ratings:
                                if hasattr(rating, 'category') and hasattr(rating, 'probability'):
                                    logger.warning(f"Prompt safety rating: {rating.category} - {rating.probability}")
                    
                    # Check if we got candidates
                    if response and response.candidates:
                        logger.debug(f"Response has {len(response.candidates)} candidates")
                        break  # Success, exit retry loop
                    else:
                        logger.warning(f"Empty response (no candidates) on attempt {attempt + 1}/{max_retries}")
                        if attempt < max_retries - 1:
                            logger.info(f"Retrying in {retry_delay} seconds...")
                            await asyncio.sleep(retry_delay)
                            retry_delay = min(retry_delay * 2, 10)  # Exponential backoff, max 10 seconds
                        else:
                            last_error = "No candidates in response after all retries"
                            
                except Exception as e:
                    logger.error(f"API call failed on attempt {attempt + 1}: {e}")
                    last_error = str(e)
                    if attempt < max_retries - 1:
                        logger.info(f"Retrying in {retry_delay} seconds...")
                        await asyncio.sleep(retry_delay)
                        retry_delay = min(retry_delay * 2, 10)
                    else:
                        raise
            
            # Extract the generated image from response
            generated_image_data = None
            text_response = None
            
            logger.debug(f"Response received. Has candidates: {bool(response and response.candidates)}")
            
            if response and response.candidates:
                logger.info(f"Response contains {len(response.candidates)} candidate(s)")
                
                for idx, candidate in enumerate(response.candidates):
                    # Log finish reason
                    if hasattr(candidate, 'finish_reason'):
                        logger.info(f"Candidate {idx} finish_reason: {candidate.finish_reason}")
                    
                    # Log safety ratings if present
                    if hasattr(candidate, 'safety_ratings') and candidate.safety_ratings:
                        for rating in candidate.safety_ratings:
                            if hasattr(rating, 'blocked') and rating.blocked:
                                logger.warning(f"Content blocked by safety filter: {rating.category} - Probability: {rating.probability if hasattr(rating, 'probability') else 'unknown'}")
                    
                    if candidate.content and candidate.content.parts:
                        logger.debug(f"Candidate {idx} has {len(candidate.content.parts)} part(s)")
                        for part_idx, part in enumerate(candidate.content.parts):
                            # Check for image data
                            if hasattr(part, 'inline_data') and part.inline_data:
                                generated_image_data = part.inline_data.data
                                logger.info(f"Part {part_idx}: Contains image data (size: {len(generated_image_data)} bytes)")
                                break
                            # Check for text response (which we don't want)
                            elif hasattr(part, 'text') and part.text:
                                text_response = part.text
                                logger.warning(f"Part {part_idx}: Contains text instead of image (length: {len(text_response)} chars)")
                                logger.debug(f"Text content: {text_response[:500]}...")
            else:
                logger.error("Response has no candidates or is empty")
                if response:
                    logger.debug(f"Response object type: {type(response)}")
            
            if not generated_image_data:
                error_details = []
                
                # Add last error from retry loop if available
                if last_error:
                    error_details.append(last_error)
                
                if not response:
                    error_details.append("Response was None or empty")
                elif not response.candidates:
                    error_details.append("No candidates in response")
                    
                    # Add prompt feedback details if available
                    if hasattr(response, 'prompt_feedback'):
                        pf = response.prompt_feedback
                        if hasattr(pf, 'block_reason') and pf.block_reason:
                            error_details.append(f"Prompt blocked: {pf.block_reason}")
                        if hasattr(pf, 'safety_ratings') and pf.safety_ratings:
                            safety_issues = []
                            for r in pf.safety_ratings:
                                if hasattr(r, 'probability') and r.probability not in ['NEGLIGIBLE', 'LOW']:
                                    category = r.category if hasattr(r, 'category') else 'unknown'
                                    prob = r.probability if hasattr(r, 'probability') else 'unknown'
                                    safety_issues.append(f"{category}:{prob}")
                            if safety_issues:
                                error_details.append(f"Safety concerns: {safety_issues}")
                elif response.candidates:
                    candidate = response.candidates[0]
                    if hasattr(candidate, 'finish_reason'):
                        error_details.append(f"Finish reason: {candidate.finish_reason}")
                    if hasattr(candidate, 'safety_ratings') and candidate.safety_ratings:
                        blocked_categories = []
                        for r in candidate.safety_ratings:
                            if hasattr(r, 'blocked') and r.blocked:
                                category = r.category if hasattr(r, 'category') else 'unknown'
                                blocked_categories.append(category)
                        if blocked_categories:
                            error_details.append(f"Blocked by safety filters: {blocked_categories}")
                
                if text_response:
                    error_details.append(f"Text response received: {text_response[:500]}")
                
                error_msg = "No image was generated. " + " | ".join(error_details) if error_details else "No image was generated in the response"
                logger.error(error_msg)
                raise ValueError(error_msg)
            
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