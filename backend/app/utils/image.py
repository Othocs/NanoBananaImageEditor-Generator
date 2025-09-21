import base64
from io import BytesIO
from typing import Optional
from PIL import Image
import logging

logger = logging.getLogger(__name__)


def base64_to_pil(base64_string: str) -> Image.Image:
    """
    Convert a base64 string to a PIL Image object.
    
    Args:
        base64_string: Base64 encoded image string
        
    Returns:
        PIL Image object
    """
    try:
        # Remove data URL prefix if present
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        # Decode base64 to bytes
        image_bytes = base64.b64decode(base64_string)
        
        # Convert bytes to PIL Image
        image = Image.open(BytesIO(image_bytes))
        
        return image
    except Exception as e:
        logger.error(f"Error converting base64 to PIL Image: {e}")
        raise ValueError(f"Failed to decode image: {str(e)}")



def bytes_to_base64(image_bytes: bytes) -> str:
    """
    Convert image bytes to a base64 string.
    
    Args:
        image_bytes: Raw image bytes
        
    Returns:
        Base64 encoded image string
    """
    try:
        return base64.b64encode(image_bytes).decode('utf-8')
    except Exception as e:
        logger.error(f"Error converting bytes to base64: {e}")
        raise ValueError(f"Failed to encode bytes: {str(e)}")


def resize_image_if_needed(image: Image.Image, max_size: int = 2048) -> Image.Image:
    """
    Resize image if it exceeds the maximum dimension.
    
    Args:
        image: PIL Image object
        max_size: Maximum dimension (width or height)
        
    Returns:
        Resized PIL Image object
    """
    width, height = image.size
    
    if width <= max_size and height <= max_size:
        return image
    
    # Calculate new dimensions maintaining aspect ratio
    if width > height:
        new_width = max_size
        new_height = int(height * (max_size / width))
    else:
        new_height = max_size
        new_width = int(width * (max_size / height))
    
    # Resize the image
    resized_image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    logger.info(f"Resized image from {width}x{height} to {new_width}x{new_height}")
    
    return resized_image
