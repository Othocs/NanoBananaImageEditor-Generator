import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import JSONResponse

from app.models.schemas import (
    GenerateImageRequest,
    ImageResponse,
    HealthResponse
)
from app.services.gemini import get_gemini_service, GeminiService
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Image Generation"])


@router.post("/generate", response_model=ImageResponse)
async def generate_image(
    request: GenerateImageRequest,
    gemini_service: GeminiService = Depends(get_gemini_service)
) -> ImageResponse:
    """
    Generate a new image based on text prompt and optional context images.
    
    Args:
        request: Generation request with prompt and optional context images
        
    Returns:
        Generated image as base64 string with metadata
    """
    try:
        logger.info(f"Received generation request with prompt: {request.prompt[:100]}...")
        
        # Extract settings
        settings_dict = request.settings.model_dump() if request.settings else {}
        temperature = settings_dict.get('temperature')
        
        # Generate image
        result = await gemini_service.generate_image(
            prompt=request.prompt,
            context_images=request.context_images,
            temperature=temperature
        )
        
        if result["success"]:
            return ImageResponse(
                success=True,
                image=result["image"],
                metadata=result["metadata"]
            )
        else:
            logger.error(f"Generation failed: {result.get('error')}")
            return ImageResponse(
                success=False,
                error=result.get("error", "Image generation failed"),
                metadata=result.get("metadata")
            )
            
    except Exception as e:
        logger.error(f"Unexpected error in generate_image: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image generation failed: {str(e)}"
        )


@router.get("/health", response_model=HealthResponse)
async def health_check(
    gemini_service: GeminiService = Depends(get_gemini_service)
) -> HealthResponse:
    """
    Check the health status of the API and Gemini service.
    
    Returns:
        Health status information
    """
    try:
        # Check Gemini service health
        is_healthy = await gemini_service.health_check()
        
        if not is_healthy:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini service is not available"
            )
        
        return HealthResponse(
            status="healthy",
            version=settings.app_version,
            model=settings.model_name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service health check failed: {str(e)}"
        )