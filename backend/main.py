from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import sys
import logging
import warnings
from datetime import datetime
from contextlib import asynccontextmanager

# Suppress scikit-learn version warnings
# Note: Models were trained with sklearn 1.5.0, current version is 1.5.2
# This is generally safe for minor version differences
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")
# Suppress pydub ffmpeg warnings
# Note: ffmpeg is not required for core functionality, only for additional audio formats
warnings.filterwarnings("ignore", category=RuntimeWarning, module="pydub")

# For safer model loading
try:
    from model_loader import safe_load_model
except ImportError:
    print("Model loader not available - will attempt standard module loading")

# Routers
try:
    # When running as a module from project root
    from backend.routers import predictions, general
    from backend.routers import analyze_voice
except ModuleNotFoundError:
    # When running directly from backend directory
    try:
        from routers import predictions, general
        from routers import analyze_voice
    except Exception as e:
        print(f"Error importing routers: {str(e)}")
        # Add current directory to path to help with imports
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from routers import predictions, general
        from routers import analyze_voice

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🔧 Initializing models...")
    try:
        predictions.initialize_models()
        logger.info("✅ Models initialized successfully")
    except Exception as e:
        logger.error(f"❌ Error initializing models: {str(e)}")
        # Don't fail startup, but log the error
        print(f"[ERROR] Model initialization failed: {str(e)}")
    
    yield
    
    # Shutdown
    logger.info("🔄 Application shutdown")

app = FastAPI(
    title="Parkinson's Disease Prediction API",
    description="API for predicting Parkinson's disease based on voice and clinical features.",
    version="1.0.0",
    dependencies=[Depends(general.get_api_key)],
    lifespan=lifespan
)

# CORS middleware configuration
# Include all possible frontend origins
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url.path} from {request.client.host}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

# Root endpoint for direct access and health checks
@app.get("/")
async def root():
    logger.info("Root endpoint accessed directly")
    return {
        "message": "Welcome to the Parkinson's Disease Prediction API. Please use /api/v1 endpoints.",
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

# Simple test endpoint that doesn't require authentication
@app.get("/test", dependencies=[])
async def test():
    logger.info("Test endpoint accessed")
    return {
        "message": "API test endpoint is working",
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

# Include routers
app.include_router(predictions.router, prefix="/api/v1")
app.include_router(general.router, prefix="/api/v1")
app.include_router(analyze_voice.router, prefix="/api/v1")

# Main Application Runner (for local development)
if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Parkinson's Disease Prediction API...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, reload_dirs=["routers", "."])