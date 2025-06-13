import { useState } from 'react';
import { apiService, CompleteVoiceData, MultiModelPredictionResponse } from '../services/api';

export function useMultiModelPrediction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MultiModelPredictionResponse | null>(null);

  const predictWithAllModels = async (voiceData: CompleteVoiceData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.predictWithAllModels(voiceData);
      setResults(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error in multi-model prediction:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const analyzeAndPredictFromVoiceFile = async (file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      // First analyze the voice file to extract features
      const voiceFeatures = await apiService.analyzeVoiceFile(file);
      
      // Then use those features to get predictions from all models
      const predictions = await apiService.predictWithAllModels(voiceFeatures);
      
      setResults(predictions);
      return { features: voiceFeatures, predictions };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Error in voice analysis and prediction:', err);
      return null;
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