from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator
import base64


class GenerationSettings(BaseModel):
    model: str = "gemini-2.5-flash-image-preview"
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    
    class Config:
        json_schema_extra = {
            "example": {
                "model": "gemini-2.5-flash-image-preview",
                "temperature": 0.8
            }
        }


class GenerateImageRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=5000, description="The text prompt for image generation")
    context_images: Optional[List[str]] = Field(None, description="Base64 encoded context images")
    settings: Optional[GenerationSettings] = None
    
    @field_validator('context_images')
    @classmethod
    def validate_base64_images(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        if v is None:
            return v
        
        validated_images = []
        for img_str in v:
            try:
                # Remove data URL prefix if present
                if ',' in img_str:
                    img_str = img_str.split(',')[1]
                # Validate base64 encoding
                base64.b64decode(img_str)
                validated_images.append(img_str)
            except Exception:
                raise ValueError(f"Invalid base64 image data")
        
        return validated_images
    
    class Config:
        json_schema_extra = {
            "example": {
                "prompt": "A cyberpunk city at sunset with neon lights",
                "context_images": [],
                "settings": {
                    "temperature": 0.8
                }
            }
        }



class ImageResponse(BaseModel):
    success: bool
    image: Optional[str] = Field(None, description="Base64 encoded generated image")
    error: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "image": "base64_encoded_image_data",
                "metadata": {
                    "generation_time": 2.5,
                    "model_used": "gemini-2.5-flash-image-preview",
                    "prompt_tokens": 15,
                    "image_tokens": 1290
                }
            }
        }


class HealthResponse(BaseModel):
    status: str
    version: str
    model: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "0.1.0",
                "model": "gemini-2.5-flash-image-preview"
            }
        }