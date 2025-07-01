"""
Dedicated module for voice analysis endpoint to improve reliability.
"""

import os
import tempfile
import logging
from fastapi import APIRouter, HTTPException, Depends, Request, File, UploadFile
from pydantic import BaseModel
import sys

# Add parent directory to path to ensure imports work
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the voice analyzer
from voice_analyzer import load_audio_safely, extract_voice_features_safely
from routers.general import get_api_key

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define the router
router = APIRouter(
    tags=["Voice Analysis"],
    dependencies=[Depends(get_api_key)]
)

# Define the response model
class VoiceFeatures(BaseModel):
    mdvpFo: float
    mdvpFhi: float
    mdvpFlo: float
    mdvpJitter: float
    mdvpShimmer: float
    nhr: float
    hnr: float
    rpde: float
    dfa: float
    spread1: float
    spread2: float
    d2: float
    ppe: float

@router.post("/analyze_voice", response_model=VoiceFeatures)
async def analyze_voice_features(request: Request, audio_file: UploadFile = File(...)):
    """
    Analyzes a voice recording to extract features.
    This is a more robust implementation that handles various audio formats.
    """
    # Initialize variables for cleanup
    tmp_audio_file_path = None

    try:
        logger.info(f"Voice analysis requested for file: {audio_file.filename} from {request.client.host}")
        
        # Basic validation
        if not audio_file:
            raise HTTPException(status_code=422, detail="No audio file provided")
        
        # Save the uploaded file to a temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
            tmp_audio_file_path = tmp_file.name
            content = await audio_file.read()
            tmp_file.write(content)
        
        logger.info(f"Temporary file created at: {tmp_audio_file_path}")
        
        # Load the audio file
        audio_data, sample_rate = load_audio_safely(tmp_audio_file_path)
        
        if audio_data is None or sample_rate is None:
            logger.error("Failed to load audio file")
            raise HTTPException(status_code=422, detail="Could not process the audio file. Please try a different format.")
        
        # Extract features
        features = extract_voice_features_safely(audio_data, sample_rate)
        
        # Convert to response model
        response = VoiceFeatures(
            mdvpFo=features['mdvpFo'],
            mdvpFhi=features['mdvpFhi'],
            mdvpFlo=features['mdvpFlo'],
            mdvpJitter=features['mdvpJitter'],
            mdvpShimmer=features['mdvpShimmer'],
            nhr=features['nhr'],
            hnr=features['hnr'],
            rpde=features['rpde'],
            dfa=features['dfa'],
            spread1=features['spread1'],
            spread2=features['spread2'],
            d2=features['d2'],
            ppe=features['ppe']
        )
        
        logger.info("Voice analysis completed successfully")
        return response
        
    except HTTPException as e:
        logger.error(f"HTTP error during voice analysis: {e.detail}")
        raise
    except Exception as e:
        logger.exception(f"Unexpected error during voice analysis: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred during voice analysis: {str(e)}")
    finally:
        # Clean up temporary file
        if tmp_audio_file_path and os.path.exists(tmp_audio_file_path):
            try:
                os.remove(tmp_audio_file_path)
                logger.info(f"Temporary file {tmp_audio_file_path} deleted")
            except Exception as e:
                logger.error(f"Error deleting temporary file: {e}")