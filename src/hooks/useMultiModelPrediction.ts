import { useState } from 'react';
import { apiService, CompleteVoiceData, MultiModelPredictionResponse, ClinicalAssessmentRequest, VoiceFeatures } from '../services/api';

export function useMultiModelPrediction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MultiModelPredictionResponse | null>(null);

  const predictWithAllModels = async (voiceData: CompleteVoiceData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Convert CompleteVoiceData to VoiceFeatures format for assessment
      const voiceFeatures: VoiceFeatures = {
        mdvpFo: voiceData.MDVP_Fo,
        mdvpFhi: voiceData.MDVP_Fhi,
        mdvpFlo: voiceData.MDVP_Flo,
        mdvpJitter: voiceData.MDVP_Jitter,
        mdvpShimmer: voiceData.MDVP_Shimmer,
        nhr: voiceData.NHR,
        hnr: voiceData.HNR,
        rpde: voiceData.RPDE,
        dfa: voiceData.DFA,
        spread1: voiceData.spread1,
        spread2: voiceData.spread2,
        d2: voiceData.D2,
        ppe: voiceData.PPE
      };

      // Create a clinical assessment request with default clinical symptoms (all false)
      // Focus on voice analysis only
      const assessmentRequest: ClinicalAssessmentRequest = {
        clinical_symptoms: {
          tremor: false,
          rigidity: false,
          bradykinesia: false,
          posturalInstability: false,
          voiceChanges: false,
          handwriting: false,
          age: 50 // Default age
        },
        voice_features: voiceFeatures
      };

      // Get prediction results directly from the backend API
      const predictionResults = await apiService.predictWithAllModels(voiceData);
      
      // Log the structure of the response for debugging
      console.log("FRONTEND: Raw prediction results structure:", 
        Object.keys(predictionResults).map(key => `${key}: ${typeof predictionResults[key]}`));
      
      // Update the state with the results
      setResults(predictionResults);
      return predictionResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error in multi-model prediction:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };
  const analyzeAndPredictFromVoiceFile = async (file: File | Blob) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!file) {
        throw new Error('No audio file provided');
      }

      // Log attempt to analyze file
      console.log('FRONTEND: Attempting to analyze voice file:', {
        type: file.type,
        size: file.size,
        name: file instanceof File ? file.name : 'blob'
      });

      // First analyze the voice file to extract features
      const voiceFeatures = await apiService.analyzeVoiceFile(file);
      
      if (!voiceFeatures) {
        throw new Error('Voice analysis failed to return features');
      }

      // Validate critical voice features
      const requiredFeatures = ['MDVP_Fo', 'MDVP_Jitter', 'MDVP_Shimmer', 'NHR'];
      for (const feature of requiredFeatures) {
        if (typeof voiceFeatures[feature as keyof CompleteVoiceData] !== 'number') {
          throw new Error(`Missing or invalid ${feature} in voice analysis results`);
        }
      }

      console.log('FRONTEND: Voice features extracted successfully:', voiceFeatures);

      // Then use those features to get predictions
      const predictions = await predictWithAllModels(voiceFeatures);
      
      if (!predictions) {
        throw new Error('Model prediction failed');
      }

      console.log('FRONTEND: Predictions completed successfully:', predictions);

      return { features: voiceFeatures, predictions };
    } catch (err) {
      let errorMessage: string;
      
      if (err instanceof Error) {
        // Handle specific error cases
        if (err.message.includes('No audio file provided') || 
            err.message.includes('Missing or invalid') ||
            err.message.includes('Unsupported audio format')) {
          errorMessage = err.message;
        } else if (err.message.includes('Network Error')) {
          errorMessage = 'Could not connect to the server. Please check your internet connection.';
        } else {
          errorMessage = 'Error processing voice recording. Please try again.';
        }
      } else {
        errorMessage = 'An unknown error occurred';
      }

      setError(errorMessage);
      console.error('Error in voice analysis and prediction:', err);
      throw new Error(errorMessage); // Re-throw to allow caller to handle
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResults(null);
    setError(null);
  };

  return {
    loading,
    error,
    results,
    predictWithAllModels,
    analyzeAndPredictFromVoiceFile,
    reset
  };
}