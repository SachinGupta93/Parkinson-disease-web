import axios from 'axios';

// Get base API URL
const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Ensure consistent URL format without double /api/v1
const API_URL = baseApiUrl.endsWith('/api/v1') ? baseApiUrl : baseApiUrl;

// API key for authentication
const API_KEY = import.meta.env.VITE_API_KEY || '7edb3e6e6d9f546569a9d6a18eaf716c8b8d037e4770b6d98b940f4c3cd669ce';

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
  prediction?: {
    status?: boolean;
    confidence?: number;
    severity?: number;
    model_predictions?: Record<string, number>;
    model_probabilities?: Record<string, number>;
  };
  recommendations?: string[];
  voice_metrics?: {
    pitch?: number;
    jitter?: number;
    shimmer?: number;
    hnr?: number;
  };
}

export interface ModelPrediction {
  prediction: number;
  probability: number;
  confidence?: number;
  risk_score?: number;
  feature_importance?: Record<string, number>;
}

export interface MultiModelPredictionResponse {
  // Support both structures: nested models object or direct model properties
  models?: {
    [key: string]: ModelPrediction | null;
  };
  // Direct model properties at the root level (alternative structure)
  [key: string]: any; // Allow for dynamic model names at root level
  model_details?: {
    [key: string]: string;
  };
  feature_importance?: {
    [key: string]: number;
  };
  summary?: {
    total_models: number;
    consensus_prediction: number;
    average_probability: number;
    probability_std: number;
    agreement_ratio: number;
  };
  timestamp?: string;
  features_used?: string[];
}

export interface ModelsInfo {
  available_models: string[];
  feature_names: string[];
  scaler?: string;
}

// Interface for clinical symptoms (boolean format)
export interface ClinicalSymptoms {
  tremor: boolean;
  rigidity: boolean;
  bradykinesia: boolean;
  posturalInstability: boolean;
  voiceChanges: boolean;
  handwriting: boolean;
  age: number;
}

// Interface for clinical assessment request
// Interface for voice features used in clinical assessment
export interface VoiceFeatures {
  mdvpFo: number;
  mdvpFhi: number;
  mdvpFlo: number;
  mdvpJitter: number;
  mdvpShimmer: number;
  nhr: number;
  hnr: number;
  rpde: number;
  dfa: number;
  spread1: number;
  spread2: number;
  d2: number;
  ppe: number;
}

export interface ClinicalAssessmentRequest {
  clinical_symptoms: ClinicalSymptoms;
  voice_features?: VoiceFeatures;
}

// Interface for clinical assessment response
export interface ClinicalAssessmentResponse {
  prediction: number;
  probability: number;
  risk_score: number;
  model_used: string;
  feature_importance?: Record<string, number>;
  has_voice_data: boolean;
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
      'X-API-Key': API_KEY
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
          nhr: data.NHR,
          hnr: data.HNR,
          rpde: data.RPDE,
          dfa: data.DFA,
          spread1: data.spread1,
          spread2: data.spread2,
          d2: data.D2,
          ppe: data.PPE
        }
      };
      
      console.log("FRONTEND: Sending data to predict_all API:", requestData);
      // Connect directly to the real backend API with no fallback
      const response = await axios.post<MultiModelPredictionResponse>(
        `${API_URL}/api/v1/predict_all`, 
        requestData, 
        { 
          headers,
          // Increase timeout for model predictions
          timeout: 30000 
        }
      );
      console.log("FRONTEND: Received multi-model prediction result:", response.data);
      return response.data;
    } catch (error) {
      console.error("FRONTEND: Error in multi-model prediction:", error);
      return this.handleError(error);
    }
  }    async analyzeVoiceFile(file: File | Blob): Promise<CompleteVoiceData> {
    try {
        // Input validation
        if (!file) {
            throw new Error('No audio file provided');
        }

        // Log file details for debugging
        const fileDetails = file instanceof File ? 
            { name: file.name, type: file.type, size: file.size } :
            { name: 'blob', type: file.type, size: file.size };
        console.log('FRONTEND: Analyzing voice file:', fileDetails);
        
        // If it's a Blob without a name, create a proper File object
        let fileToSend: File;
        if (file instanceof Blob && !(file instanceof File)) {
            // Determine the correct extension and mime type
            const isWebM = file.type === 'audio/webm' || file.type?.includes('webm');
            const isWav = file.type === 'audio/wav' || file.type?.includes('wav');
            
            let extension = '.wav'; // Default to wav
            let mimeType = 'audio/wav'; // Default to wav
            
            if (isWebM) {
                extension = '.webm';
                mimeType = 'audio/webm';
            } else if (isWav) {
                extension = '.wav';
                mimeType = 'audio/wav';
            }
            
            fileToSend = new File([file], `voice-recording${extension}`, { type: mimeType });
        } else {
            fileToSend = file as File;
        }

        // Validate file type - handle the case with codecs in the mime type
        const validTypes = ['audio/wav', 'audio/webm', 'audio/ogg', 'audio/wave', 'audio/x-wav'];
        const fileType = fileToSend.type || 'audio/wav'; // Default to wav if type is missing
        const baseType = fileType.split(';')[0]; // Extract base type before any codec info
        
        if (!validTypes.includes(baseType)) {
            throw new Error(`Unsupported audio format: ${fileToSend.type}. Please use WAV or WebM format.`);
        }
        
        // Log the file being sent for debugging
        console.log(`FRONTEND: Sending audio file for analysis: ${fileToSend.name}, type: ${fileToSend.type}, size: ${fileToSend.size} bytes`);
        
        // Add a retry mechanism for better reliability
        let retries = 3;
        let lastError = null;
        
        while (retries > 0) {
            try {
                // Create a new FormData for each attempt
                const formData = new FormData();
                formData.append('audio_file', fileToSend);
                
                // Make the request with a longer timeout
                const response = await axios.post(
                    `${API_URL}/api/v1/analyze_voice`,
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'X-API-KEY': API_KEY,
                        },
                        timeout: 30000, // 30 seconds timeout
                    }
                );
                
                console.log('FRONTEND: Backend voice analysis response:', response.data);
                
                // Convert backend format to frontend format
                const voiceData: CompleteVoiceData = {
                    MDVP_Fo: response.data.mdvpFo,
                    MDVP_Fhi: response.data.mdvpFhi,
                    MDVP_Flo: response.data.mdvpFlo,
                    MDVP_Jitter: response.data.mdvpJitter,
                    MDVP_Jitter_Abs: 0, // These features are calculated from the basic ones
                    MDVP_RAP: 0,
                    MDVP_PPQ: 0,
                    Jitter_DDP: 0,
                    MDVP_Shimmer: response.data.mdvpShimmer,
                    MDVP_Shimmer_dB: 0,
                    Shimmer_APQ3: 0,
                    Shimmer_APQ5: 0,
                    MDVP_APQ: 0,
                    Shimmer_DDA: 0,
                    NHR: response.data.nhr,
                    HNR: response.data.hnr,
                    RPDE: response.data.rpde,
                    DFA: response.data.dfa,
                    spread1: response.data.spread1,
                    spread2: response.data.spread2,
                    D2: response.data.d2,
                    PPE: response.data.ppe
                };
                
                console.log('FRONTEND: Voice analysis data converted from backend format:', voiceData);
                return voiceData;
            } catch (error) {
                lastError = error;
                retries--;
                
                if (retries > 0) {
                    console.log(`FRONTEND: Retrying voice analysis (${retries} attempts left)...`);
                    // Wait a bit before retrying
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
        
        // If we get here, all retries failed
        throw lastError;    } catch (error) {
        console.error('FRONTEND: Error analyzing voice file:', error);
        let errorMessage = 'Error analyzing voice file. ';
        
        if (error instanceof Error) {
            // Handle client-side validation errors
            if (error.message.includes('Unsupported audio format') || error.message.includes('No audio file provided')) {
                throw error; // Re-throw validation errors as-is
            }
        }
        
        if (axios.isAxiosError(error)) {
            const statusCode = error.response?.status;
            const backendErrorData = error.response?.data?.detail;
            
            // Handle backend error data which can be a string or object
            let backendError = '';
            if (typeof backendErrorData === 'string') {
                backendError = backendErrorData;
            } else if (typeof backendErrorData === 'object' && backendErrorData !== null) {
                // Extract message from error object
                backendError = backendErrorData.message || backendErrorData.error || JSON.stringify(backendErrorData);
            }
            
            switch (statusCode) {
                case 400:
                    errorMessage = `Invalid request: ${backendError || 'Please check your audio file.'}`;
                    break;
                case 413:
                    errorMessage = 'Audio file is too large. Please use a shorter recording.';
                    break;
                case 415:
                    errorMessage = 'Unsupported audio format. Please use WAV or WebM format.';
                    break;
                case 422:
                    errorMessage = backendError || 'Invalid file format or content. Please ensure you\'re using a supported audio format (WAV or WebM).';
                    break;
                case 500:
                    errorMessage = 'Server error processing the audio. Please try again or use a different audio file.';
                    break;
                default:
                    errorMessage = backendError || error.message || 'Unknown error occurred.';
            }
        }
        
        // Log the error for debugging
        console.error('FRONTEND: Voice analysis error details:', {
            errorMessage,
            originalError: error
        });
        
        throw new Error(errorMessage);
    }
}
  
  async getModelsInfo(): Promise<ModelsInfo> {
    try {
      const response = await axios.get<ModelsInfo>(`${API_URL}/api/v1/models`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error getting models info:', error);
      throw error;
    }
  }

  async getHealthCheck(): Promise<{ message: string }> {
    try {
      const response = await axios.get<{ message: string }>(`${API_URL}/api/v1/`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error checking API health:', error);
      throw error;
    }
  }

  async assessClinicalSymptoms(request: ClinicalAssessmentRequest): Promise<ClinicalAssessmentResponse> {
    try {
      console.log("FRONTEND: Sending clinical assessment request:", request);
      const response = await axios.post<ClinicalAssessmentResponse>(
        `${API_URL}/api/v1/assess_clinical`,
        request,
        {
          headers: this.getHeaders()
        }
      );
      
      console.log("FRONTEND: Clinical assessment response:", response.data);
      return response.data;
    } catch (error) {
      console.error("FRONTEND: Error during clinical assessment:", error);
      return this.handleError(error);
    }
  }
}

// Export the singleton instance
export const apiService = ApiService.getInstance();
