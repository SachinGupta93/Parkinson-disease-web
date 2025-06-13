// Types related to voice analysis

// Voice features input to the API
export interface VoiceFeatures {
  pitch: number;
  jitter: number;
  shimmer: number;
  hnr: number;
}

// Voice features from the feature extractor
export interface ExtractedVoiceFeatures {
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

// Analysis response from the API
export interface VoiceAnalysisResponse {
  status: boolean;
  confidence: number;
  severity: number;
  recommendations: string[];
  model_predictions?: Record<string, boolean>;
  model_probabilities?: Record<string, number>;
}

// For historical data storage
export interface VoiceHistoryData {
  timestamp: Date;
  voiceMetrics: {
    pitch: number;
    amplitude: number;
    frequency: number;
    tremor: number;
  };
  analysisResults: {
    severity: number;
    confidence: number;
    recommendations: string[];
  };
}

// For history entries
export interface HistoryEntry {
  type: 'voice_analysis' | 'gait_analysis' | 'tremor_analysis';
  date: Date;
  data: any;
}
