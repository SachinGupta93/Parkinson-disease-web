import axios from 'axios';

// Get base API URL
const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Ensure consistent URL format without double /api/v1
const API_URL = baseApiUrl.endsWith('/api/v1') ? baseApiUrl : baseApiUrl;

console.log("API Service using backend URL:", API_URL);

// Interface for the full set of voice features
export interface CompleteVoiceData {
  MDVP_Fo: number;
  MDVP_Fhi: number;
  MDVP_Flo: number;
  MDVP_Jitter: number;
  MDVP_Jitter_Abs: number;
  MDVP_RAP: number;
  MDVP_PPQ: number;
  Jitter_DDP: number;
  MDVP_Shimmer: number;
  MDVP_Shimmer_dB: number;
  Shimmer_APQ3: number;
  Shimmer_APQ5: number;
  MDVP_APQ: number;
  Shimmer_DDA: number;
  NHR: number;
  HNR: number;
  RPDE: number;
  DFA: number;
  spread1: number;
  spread2: number;
  D2: number;
  PPE: number;
}

// Interface for the simplified voice data expected by the FastAPI backend
export interface VoiceData {
  pitch: number;
  jitter: number;
  shimmer: number;
  hnr: number;
}

export interface PredictionResponse {
  timestamp: string;
  prediction: {
    status: boolean;
    confidence: number;
    severity: number;
    model_predictions: Record<string, number>;
    model_probabilities: Record<string, number>;
  };
  recommendations: string[];
  voice_metrics: {
    pitch: number;
    jitter: number;
    shimmer: number;
    hnr: number;
  };
}

export interface ModelPrediction {
  prediction: number;
  probability: number;
  feature_importance?: Record<string, number>;
}

export interface MultiModelPredictionResponse {
  ensemble?: ModelPrediction;
  random_forest?: ModelPrediction;
  svm?: ModelPrediction;
  gradient_boosting?: ModelPrediction;
  neural_network?: ModelPrediction;
  adaboost?: ModelPrediction;
  extra_trees?: ModelPrediction;
  loaded_models: string[];
  chart_data?: {
    model_names: string[];
    probabilities: number[];
    predictions: number[];
    colors: string[];
    threshold: number;
    feature_names: string[];
    feature_values: number[];
  };
}

export interface ModelsInfo {
  available_models: string[];
  feature_names: string[];
  scaler?: string;
}

class ApiService {
  private static instance: ApiService;
  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-API-Key': import.meta.env.VITE_API_KEY || 'your-secure-api-key'
    };
  }

  private handleError(error: unknown): never {
    console.error('API error:', error);
    if (axios.isAxiosError(error) && error.response) {
      // Handle specific status codes
      if (error.response.status === 429) {
        throw new Error('Too many requests. Please try again later.');
      } else if (error.response.status === 403) {
        throw new Error('Authentication failed. Please check your API key.');
      } else {
        throw new Error(`Server error (${error.response.status}): ${error.response.data.detail || 'Unknown error'}`);
      }
    }
    throw new Error('Network error. Please check your connection.');
  }

  async analyzeVoice(data: VoiceData): Promise<PredictionResponse> {
    try {
      console.log("FRONTEND: Sending voice data to API:", data);
      const headers = this.getHeaders();
      const response = await axios.post<PredictionResponse>(`${API_URL}/api/v1/predict`, data, { headers });
      
      // Add timestamp if it's not included in the response
      const result = {
        ...response.data,
        timestamp: response.data.timestamp || new Date().toISOString(),
        voice_metrics: data
      };
      
      console.log("FRONTEND: Received prediction result:", result);
      return result;
    } catch (error) {
      console.error("FRONTEND: Error in voice analysis:", error);
      return this.handleError(error);
    }
  }

  async predictWithAllModels(data: CompleteVoiceData): Promise<MultiModelPredictionResponse> {
    try {
      const headers = this.getHeaders();
      
      // Convert the data to the format expected by the backend
      const requestData = {
        features: {
          mdvpFo: data.MDVP_Fo,
          mdvpFhi: data.MDVP_Fhi,
          mdvpFlo: data.MDVP_Flo,
          mdvpJitter: data.MDVP_Jitter,
          mdvpShimmer: data.MDVP_Shimmer,
          hnr: data.HNR,
          nhr: data.NHR,
          rpde: data.RPDE,
          dfa: data.DFA,
          spread1: data.spread1,
          spread2: data.spread2,
          d2: data.D2,
          ppe: data.PPE
        }
      };
      
      console.log("FRONTEND: Sending data to predict_all API:", requestData);
      
      const response = await axios.post<MultiModelPredictionResponse>(
        `${API_URL}/api/v1/predict_all`, 
        requestData, 
        { headers }
      );
      
      console.log("FRONTEND: Received multi-model prediction result:", response.data);
      return response.data;
    } catch (error) {
      console.error("FRONTEND: Error in multi-model prediction:", error);
      return this.handleError(error);
    }
  }

  async analyzeVoiceFile(file: File): Promise<CompleteVoiceData> {
    try {
      console.log(`FRONTEND: Analyzing voice file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `${API_URL}/api/v1/analyze_voice`, 
        formData, 
        { 
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-API-Key': import.meta.env.VITE_API_KEY || 'your-secure-api-key'
          }
        }
      );
      
      // Map the backend response fields to the frontend expected format
      const backendData = response.data;
      
      // Convert from backend format (camelCase) to frontend format (UPPERCASE_UNDERSCORE)
      const frontendData: CompleteVoiceData = {
        MDVP_Fo: backendData.mdvpFo,
        MDVP_Fhi: backendData.mdvpFhi,
        MDVP_Flo: backendData.mdvpFlo,
        MDVP_Jitter: backendData.mdvpJitter,
        MDVP_Jitter_Abs: 0, // Not provided by backend
        MDVP_RAP: 0, // Not provided by backend
        MDVP_PPQ: 0, // Not provided by backend
        Jitter_DDP: 0, // Not provided by backend
        MDVP_Shimmer: backendData.mdvpShimmer,
        MDVP_Shimmer_dB: 0, // Not provided by backend
        Shimmer_APQ3: 0, // Not provided by backend
        Shimmer_APQ5: 0, // Not provided by backend
        MDVP_APQ: 0, // Not provided by backend
        Shimmer_DDA: 0, // Not provided by backend
        NHR: backendData.nhr,
        HNR: backendData.hnr,
        RPDE: backendData.rpde,
        DFA: backendData.dfa,
        spread1: backendData.spread1,
        spread2: backendData.spread2,
        D2: backendData.d2,
        PPE: backendData.ppe
      };
      
      console.log("FRONTEND: Voice analysis data converted from backend format:", frontendData);
      return frontendData;
    } catch (error) {
      console.error("FRONTEND: Error analyzing voice file:", error);
      return this.handleError(error);
    }
  }

  async getModelsInfo(): Promise<ModelsInfo> {
    try {
      const response = await axios.get<ModelsInfo>(`${API_URL}/api/v1/models`);
      return response.data;
    } catch (error) {
      console.error('Error getting models info:', error);
      throw error;
    }
  }

  async getHealthCheck(): Promise<{ message: string }> {
    try {
      const response = await axios.get<{ message: string }>(`${API_URL}/api/v1/`);
      return response.data;
    } catch (error) {
      console.error('Error checking API health:', error);
      throw error;
    }
  }
}

export const apiService = ApiService.getInstance();