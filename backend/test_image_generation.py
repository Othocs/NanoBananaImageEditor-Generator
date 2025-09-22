#!/usr/bin/env python3
"""
Test script to verify image generation works correctly and only returns images.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.gemini import GeminiService
from app.config import settings

async def test_image_generation():
    """Test various prompts to ensure only images are returned."""
    
    # Initialize service
    service = GeminiService()
    
    test_prompts = [
        "A beautiful sunset over mountains",
        "Generate a picture of a cat",
        "What is 2+2?",  # This should fail or return an image, not text
        "Explain quantum physics",  # This should also fail or return an image
        "Draw a red circle on blue background",
        "Create an image of a futuristic city"
    ]
    
    for i, prompt in enumerate(test_prompts, 1):
        print(f"\n{'='*60}")
        print(f"Test {i}: {prompt}")
        print('='*60)
        
        try:
            result = await service.generate_image(
                prompt=prompt,
                temperature=0.7
            )
            
            if result["success"]:
                # Check if we got image data
                image_data = result.get("image")
                if image_data:
                    print(f"✓ SUCCESS: Image generated")
                    print(f"  - Image data length: {len(image_data)} chars")
                    print(f"  - Generation time: {result['metadata']['generation_time']:.2f}s")
                else:
                    print(f"✗ FAILURE: No image data in successful response")
            else:
                print(f"✗ FAILURE: {result.get('error', 'Unknown error')}")
                
        except Exception as e:
            print(f"✗ ERROR: {str(e)}")
    
    print(f"\n{'='*60}")
    print("Test completed!")
    print('='*60)

if __name__ == "__main__":
    # Check for API key
    if not settings.gemini_api_key:
        print("ERROR: GEMINI_API_KEY not set in .env file")
        sys.exit(1)
    
    print(f"Using model: {settings.model_name}")
    print(f"Starting image generation tests...")
    
    asyncio.run(test_image_generation())