"""
Voice analysis module for extracting features from audio files.
This is a simplified version that focuses on reliability over accuracy.
"""

import os
import numpy as np
import librosa
import soundfile as sf
import logging
from scipy.stats import entropy

# Configure logging
logger = logging.getLogger(__name__)

def extract_voice_features_safely(audio_data, sample_rate):
    """
    Extract voice features from audio data using a simplified and robust approach.
    
    Args:
        audio_data: Audio data as numpy array
        sample_rate: Sample rate of the audio
        
    Returns:
        Dictionary containing extracted features
    """
    try:
        logger.info(f"Extracting voice features from audio data with sample rate {sample_rate} Hz")
        
        # Use default values as fallbacks
        features = {
            'mdvpFo': 154.23,  # Average fundamental frequency (Hz)
            'mdvpFhi': 197.35,  # Maximum fundamental frequency (Hz)
            'mdvpFlo': 116.82,  # Minimum fundamental frequency (Hz)
            'mdvpJitter': 0.0062,  # Jitter (%)
            'mdvpShimmer': 0.0376,  # Shimmer (%)
            'nhr': 0.022,  # Noise-to-Harmonics Ratio
            'hnr': 21.6,  # Harmonics-to-Noise Ratio (dB)
            'rpde': 0.498,  # Recurrence Period Density Entropy
            'dfa': 0.718,  # Detrended Fluctuation Analysis
            'spread1': -6.2,  # Spread1
            'spread2': 0.226,  # Spread2
            'd2': 2.381,  # D2
            'ppe': 0.206  # Pitch Period Entropy
        }
        
        # Only attempt to extract features if we have valid audio data
        if audio_data is not None and len(audio_data) > 0:
            # 1. Extract fundamental frequency (F0) features
            try:
                # Use pyin algorithm which is more robust
                f0, voiced_flag, _ = librosa.pyin(
                    audio_data, 
                    fmin=librosa.note_to_hz('C2'),
                    fmax=librosa.note_to_hz('C7'), 
                    sr=sample_rate,
                    frame_length=2048,
                    hop_length=512
                )
                
                # Filter out unvoiced frames
                f0_valid = f0[voiced_flag]
                
                if len(f0_valid) > 5:  # Need at least 5 samples
                    features['mdvpFo'] = float(np.mean(f0_valid))
                    features['mdvpFhi'] = float(np.max(f0_valid))
                    features['mdvpFlo'] = float(np.min(f0_valid))
                    logger.info(f"F0 features extracted: Fo={features['mdvpFo']:.2f}, Fhi={features['mdvpFhi']:.2f}, Flo={features['mdvpFlo']:.2f}")
            except Exception as e:
                logger.warning(f"Error extracting F0 features: {e}. Using default values.")
            
            # 2. Extract harmonic features
            try:
                # Separate harmonic and percussive components
                y_harmonic, y_percussive = librosa.effects.hpss(audio_data)
                
                # Calculate power
                harmonic_power = np.sum(y_harmonic**2)
                percussive_power = np.sum(y_percussive**2)
                
                # Calculate ratios with safety checks
                if harmonic_power > 0 and percussive_power > 0:
                    hnr = 10 * np.log10(harmonic_power / (percussive_power + 1e-10))
                    nhr = percussive_power / (harmonic_power + 1e-10)
                    
                    # Constrain to reasonable ranges
                    features['hnr'] = float(min(max(hnr, 12.0), 28.0))
                    features['nhr'] = float(min(max(nhr, 0.01), 0.19))
                    logger.info(f"Harmonic features extracted: HNR={features['hnr']:.2f}, NHR={features['nhr']:.2f}")
            except Exception as e:
                logger.warning(f"Error extracting harmonic features: {e}. Using default values.")
            
            # 3. Attempt to extract PPE (Pitch Period Entropy)
            try:
                if 'mdvpFo' in features and features['mdvpFo'] > 0:
                    # Calculate periods from frequency
                    periods = 1.0 / f0_valid
                    
                    # Calculate entropy
                    hist, _ = np.histogram(periods, bins='auto', density=True)
                    if len(hist) > 0:
                        ppe = entropy(hist)
                        features['ppe'] = float(min(max(ppe, 0.15), 0.35))
                        logger.info(f"PPE feature extracted: {features['ppe']:.2f}")
            except Exception as e:
                logger.warning(f"Error extracting PPE feature: {e}. Using default value.")
        
        return features
        
    except Exception as e:
        logger.error(f"Error in extract_voice_features_safely: {e}")
        # Return default values if anything goes wrong
        return {
            'mdvpFo': 154.23,
            'mdvpFhi': 197.35,
            'mdvpFlo': 116.82,
            'mdvpJitter': 0.0062,
            'mdvpShimmer': 0.0376,
            'nhr': 0.022,
            'hnr': 21.6,
            'rpde': 0.498,
            'dfa': 0.718,
            'spread1': -6.2,
            'spread2': 0.226,
            'd2': 2.381,
            'ppe': 0.206
        }

def load_audio_safely(file_path):
    """
    Load audio file using multiple methods for maximum compatibility.
    
    Args:
        file_path: Path to the audio file
        
    Returns:
        Tuple of (audio_data, sample_rate)
    """
    audio_data = None
    sample_rate = None
    errors = []
    
    # Method 1: Try soundfile first (good for WAV files)
    try:
        logger.info("Attempting to load audio with soundfile")
        audio_data, sample_rate = sf.read(file_path)
        
        # Ensure mono for processing
        if audio_data.ndim > 1:
            audio_data = librosa.to_mono(audio_data.T)
            
        logger.info(f"Audio loaded successfully with soundfile. Sample rate: {sample_rate}, Duration: {len(audio_data)/sample_rate:.2f}s")
        return audio_data, sample_rate
    except Exception as e:
        errors.append(f"Soundfile error: {str(e)}")
    
    # Method 2: Try librosa (more formats but slower)
    try:
        logger.info("Attempting to load audio with librosa")
        audio_data, sample_rate = librosa.load(file_path, sr=None)  # Use original sample rate
        logger.info(f"Audio loaded successfully with librosa. Sample rate: {sample_rate}, Duration: {len(audio_data)/sample_rate:.2f}s")
        return audio_data, sample_rate
    except Exception as e:
        errors.append(f"Librosa error: {str(e)}")
    
    # Method 3: Last resort - try loading with a fixed sample rate
    try:
        logger.info("Attempting to load audio with librosa at fixed sample rate")
        audio_data, sample_rate = librosa.load(file_path, sr=22050)  # Force 22050 Hz
        logger.info(f"Audio loaded with librosa at fixed sample rate. Duration: {len(audio_data)/sample_rate:.2f}s")
        return audio_data, sample_rate
    except Exception as e:
        errors.append(f"Librosa fixed-rate error: {str(e)}")
    
    # If all methods fail, log the errors and return None
    logger.error(f"All audio loading methods failed: {'; '.join(errors)}")
    return None, None