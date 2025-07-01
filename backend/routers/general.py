# filepath: c:\\Users\\DELL\\Downloads\\parkinson-insight-web\\backend\\routers\\general.py
from fastapi import APIRouter, Depends, HTTPException, Request
from datetime import datetime
import logging
import os

router = APIRouter(
    tags=["General"],
)

logger = logging.getLogger(__name__)

# --- API Key Authentication (Simple Example) ---
API_KEY_NAME = "X-API-Key"
API_KEY = os.environ.get("API_KEY", "7edb3e6e6d9f546569a9d6a18eaf716c8b8d037e4770b6d98b940f4c3cd669ce") # Changed

async def get_api_key(request: Request):
    api_key_header = request.headers.get(API_KEY_NAME)
    if not api_key_header or api_key_header != API_KEY:
        logger.warning(f"Unauthorized API key attempt from {request.client.host}")
        raise HTTPException(status_code=403, detail="Invalid or missing API Key")
    return api_key_header

@router.get("/", dependencies=[Depends(get_api_key)])
async def root():
    """Root endpoint for the API."""
    timestamp = datetime.now().isoformat()
    logger.info(f"[{timestamp}] Root endpoint accessed.")
    return {"message": "Welcome to the Parkinson's Disease Prediction API", "timestamp": timestamp}

@router.get("/health", dependencies=[Depends(get_api_key)])
async def health_check():
    """Check the health of the API."""
    timestamp = datetime.now().isoformat()
    # Accessing scaler from the main app context or by passing it if needed.
    # For simplicity, assuming a global check or refactor to pass dependencies.
    # models_loaded_status = app.state.scaler is not None # Example if scaler was in app.state
    logger.info(f"[{timestamp}] Health check endpoint accessed.")
    # Note: To check if models are loaded, you'd need to access them.
    # This might require passing model/scaler instances to the router or using app.state.
    # For now, simplifying to just API health.
    return {"status": "healthy", "timestamp": timestamp, "message": "API is operational. Model status check needs context."}

@router.get("/educational_resources", dependencies=[Depends(get_api_key)])
async def get_educational_resources():
    """Retrieve educational resources about Parkinson's disease."""
    timestamp = datetime.now().isoformat()
    logger.info(f"[{timestamp}] Educational resources requested.")
    resources = [
        {
            "id": "pd-overview",
            "title": "Understanding Parkinson's Disease",
            "description": "An overview of Parkinson's disease, its causes, symptoms, and treatments.",
            "url": "https://www.nia.nih.gov/health/parkinsons-disease",
            "imageUrl": "https://placehold.co/600x400?text=Parkinson's+Disease"
        },
        {
            "id": "early-signs",
            "title": "Early Signs and Symptoms",
            "description": "Recognizing the early warning signs of Parkinson's disease.",
            "url": "https://www.parkinson.org/understanding-parkinsons/10-early-warning-signs",
            "imageUrl": "https://placehold.co/600x400?text=Early+Signs"
        },
    ]
    return resources
