from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # API Keys
    gemini_api_key: str
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = int(os.getenv("PORT", "8000"))  # Railway sets PORT env var
    
    # CORS Configuration (optional - empty means allow all origins)
    cors_origins: str = ""
    
    # File Upload Configuration
    max_file_size: int = 10485760  # 10MB
    allowed_extensions: str = "jpg,jpeg,png,webp"
    
    # API Settings
    api_timeout: int = 60
    model_name: str = "models/gemini-2.5-flash-image-preview"
    
    # Application Settings
    app_title: str = "Nano Banana Image Editor API"
    app_version: str = "0.1.0"
    debug: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    @property
    def cors_origins_list(self) -> List[str]:
        # If cors_origins is empty or not set, allow all origins
        if not self.cors_origins or self.cors_origins.strip() == "":
            return ["*"]
        # Otherwise, parse the comma-separated list
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
    
    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip().lower() for ext in self.allowed_extensions.split(",")]


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()