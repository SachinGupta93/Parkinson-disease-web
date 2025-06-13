import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// API key for authentication with the backend
const API_KEY = '7edb3e6e6d9f546569a9d6a18eaf716c8b8d037e4770b6d98b940f4c3cd669ce';

// Configure axios with default headers
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json',
  }
});

interface ModelsInfo {
  available_models: string[];
  scaler: string;
}

// Sample models for demonstration when API is not available
const SAMPLE_MODELS = [
  "Random Forest",
  "SVM",
  "Neural Network",
  "Gradient Boosting",
  "Ensemble"
];

export function useBackendModels() {
  const [models, setModels] = useState<string[]>(SAMPLE_MODELS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<ModelsInfo>('/api/v1/models');
        setModels(response.data.available_models);
        setError(null);
      } catch (err) {
        console.error('Error fetching models:', err);
        // Use sample models instead of empty array when API fails
        setModels(SAMPLE_MODELS);
        setError('Failed to load models from backend');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const refreshModels = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<ModelsInfo>('/api/v1/models');
      setModels(response.data.available_models);
      setError(null);
    } catch (err) {
      console.error('Error refreshing models:', err);
      // Keep using sample models if refresh fails
      setModels(SAMPLE_MODELS);
      setError('Failed to refresh models from backend');
    } finally {
      setLoading(false);
    }
  };

  return { models, loading, error, refreshModels };
}
