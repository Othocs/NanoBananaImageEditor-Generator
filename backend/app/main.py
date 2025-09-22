import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.api.endpoints import generate

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.debug else logging.WARNING,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# Set specific loggers to DEBUG level when in debug mode
if settings.debug:
    logging.getLogger("app.services.gemini").setLevel(logging.DEBUG)
    logging.getLogger("app.api.endpoints.generate").setLevel(logging.DEBUG)
    logging.getLogger("app.utils.image").setLevel(logging.DEBUG)
    logger.info("Debug mode enabled - verbose logging active for Gemini services")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting {settings.app_title} v{settings.app_version}")
    logger.info(f"Using model: {settings.model_name}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")


# Create FastAPI app
app = FastAPI(
    title=settings.app_title,
    version=settings.app_version,
    description="API for generating and editing images using Google Gemini 2.5 Flash",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)


# Custom exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with detailed messages."""
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error['loc'])
        message = error['msg']
        errors.append(f"{field}: {message}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "Validation error",
            "details": errors
        }
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "An unexpected error occurred"
        }
    )


# Middleware for request logging - must be before CORS
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests."""
    # Don't log OPTIONS requests as errors
    if request.method == "OPTIONS":
        logger.debug(f"CORS Preflight: {request.method} {request.url.path}")
    else:
        logger.info(f"Request: {request.method} {request.url.path}")
    
    response = await call_next(request)
    
    if request.method == "OPTIONS":
        logger.debug(f"CORS Preflight Response: {response.status_code}")
    else:
        logger.info(f"Response: {response.status_code}")
    
    return response


# Configure CORS - MUST be added LAST (executes FIRST in middleware stack)
logger.info(f"CORS: Configured origins: {settings.cors_origins_list}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"]
)


# Include routers
app.include_router(generate.router)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": settings.app_title,
        "version": settings.app_version,
        "status": "running",
        "documentation": "/docs",
        "endpoints": {
            "generate": "/api/generate",
            "health": "/api/health"
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info" if settings.debug else "warning"
    )