// Shared types for the Parkinson's Disease Assessment application

export interface ParkinsonsFeatures {
  // Voice features from MDVP (Multiple Dimensional Voice Program)
  mdvpFo?: number;       // Average vocal fundamental frequency (Hz)
  mdvpFhi?: number;      // Maximum vocal fundamental frequency (Hz)
  mdvpFlo?: number;      // Minimum vocal fundamental frequency (Hz)
  mdvpJitter?: number;   // Jitter percentage
  mdvpJitterAbs?: number; // Absolute jitter
  mdvpRAP?: number;      // Relative amplitude perturbation
  mdvpPPQ?: number;      // Five-point period perturbation quotient
  jitterDDP?: number;    // Average absolute difference of differences of periods
  
  // Shimmer features
  mdvpShimmer?: number;  // Shimmer percentage
  mdvpShimmerDB?: number; // Shimmer in dB
  shimmerAPQ3?: number;  // Three-point amplitude perturbation quotient
  shimmerAPQ5?: number;  // Five-point amplitude perturbation quotient
  mdvpAPQ?: number;      // MDVP APQ (amplitude perturbation quotient)
  shimmerDDA?: number;   // Average absolute differences between amplitudes
  shimmer?: number;      // General shimmer value
  
  // Noise and frequency measures
  nhr?: number;          // Noise-to-harmonics ratio
  hnr?: number;          // Harmonics-to-noise ratio
  
  // Nonlinear measures
  rpde?: number;         // Recurrence period density entropy
  dfa?: number;          // Detrended fluctuation analysis
  spread1?: number;      // Nonlinear measure of fundamental frequency variation
  spread2?: number;      // Nonlinear measure of fundamental frequency variation
  d2?: number;           // Correlation dimension
  ppe?: number;          // Pitch period entropy
  
  // Clinical features (mapped from the symptom form)
  tremor: number;
  rigidity: number;
  bradykinesia: number;
  posturalInstability: number;
  voiceChanges: number;
  handwriting: number;
  age: number;
}

export type ModelType = 'gradient_boosting' | 'randomForest' | 'neuralNetwork' | 'svm' | 'adaboost' | 'extra_trees' | 'xgboost' | 'ensemble';

export interface PredictionResult {
  riskScore: number;
  probability: number;
  status: number;
  modelUsed: ModelType;
  modelName?: string; // Adding modelName property
  confidence: number;
  featureImportance?: Record<string, number>;
  allModelResults?: PredictionResult[];
}
