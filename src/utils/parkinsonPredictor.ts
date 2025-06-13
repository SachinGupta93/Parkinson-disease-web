// This file simulates multiple machine learning models for Parkinson's disease prediction
// In a real implementation, this would connect to a Python backend with the various models

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
  shimmer?: number;      // General shimmer value - added to fix TypeScript errors
  
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
  confidence: number;
  featureImportance?: Record<string, number>;
}

// This function simulates the ML model prediction
export const predictParkinsonRisk = (
  features: ParkinsonsFeatures, 
  modelType: ModelType = 'gradient_boosting'
): PredictionResult => {
  // In reality, this would send a request to a Python backend with the selected trained model
  
  switch(modelType) {
    case 'gradient_boosting':
      return predictWithGradientBoosting(features);
    case 'randomForest':
      return predictWithRandomForest(features);
    case 'neuralNetwork':
      return predictWithNeuralNetwork(features);
    case 'svm':
      return predictWithSVM(features);
    case 'adaboost':
      return predictWithAdaBoost(features);
    case 'extra_trees':
      return predictWithExtraTrees(features);
    case 'xgboost':
      return predictWithXGBoost(features);
    case 'ensemble':
      return getEnsemblePrediction(features);
    default:
      return predictWithGradientBoosting(features);
  }
};

// Gradient Boosting model simulation
const predictWithGradientBoosting = (features: ParkinsonsFeatures): PredictionResult => {
  // Convert clinical symptoms to a risk score (0-100)
  const clinicalScore = 
    (features.tremor * 0.2) + 
    (features.rigidity * 0.15) + 
    (features.bradykinesia * 0.2) + 
    (features.posturalInstability * 0.15) + 
    (features.voiceChanges * 0.1) + 
    (features.handwriting * 0.1);
  
  // Age factor (simplified)
  const ageRisk = features.age > 60 ? (features.age - 60) * 0.05 : 0;
  
  // Voice features (if available)
  let voiceScore = 0;
  let probability = 0.5; // Default 50% probability
  
  if (features.mdvpFo && features.mdvpJitter) {
    // Based on patterns from the dataset: PD patients often have higher jitter and 
    // different fundamental frequency patterns
    const jitterImpact = features.mdvpJitter > 0.006 ? 0.15 : 0;
    const foImpact = (features.mdvpFo < 120 || features.mdvpFo > 180) ? 0.1 : 0;
    
    // Additional voice features if available
    let additionalVoiceScore = 0;
    
    if (features.mdvpShimmer && features.mdvpShimmer > 0.04) {
      additionalVoiceScore += 0.1;
    }
    
    if (features.hnr && features.hnr < 20) {
      additionalVoiceScore += 0.1;
    }
    
    if (features.nhr && features.nhr > 0.02) {
      additionalVoiceScore += 0.05;
    }
    
    voiceScore = jitterImpact + foImpact + additionalVoiceScore;
    
    // Adjust probability based on voice features
    probability = 0.5 + (voiceScore * 0.5);
  }
  
  // Advanced measures if available
  let advancedScore = 0;
  
  if (features.spread1 && features.spread1 > -5) {
    advancedScore += 0.1;
  }
  
  if (features.spread2 && features.spread2 > 0.3) {
    advancedScore += 0.1;
  }
  
  if (features.ppe && features.ppe > 0.2) {
    advancedScore += 0.1;
  }
  
  // Combine scores (normalize to 0-100)
  const totalRisk = Math.min(
    Math.round(((clinicalScore / 10) + ageRisk + voiceScore + advancedScore) * 100), 
    100
  );
  
  // Clinical decision (status): 1 for Parkinson's (high risk), 0 for healthy (low risk)
  const status = totalRisk > 50 ? 1 : 0;
  
  // Feature importance for XGBoost (simulated)
  const featureImportance = {
    'tremor': 0.22,
    'bradykinesia': 0.19,
    'rigidity': 0.17,
    'posturalInstability': 0.15,
    'voiceChanges': 0.12,
    'handwriting': 0.10,
    'age': 0.05
  };
  
  return {
    riskScore: totalRisk,
    probability: probability > 1 ? 1 : probability,
    status,
    modelUsed: 'gradient_boosting',
    confidence: 0.87,
    featureImportance
  };
};

// Random Forest model simulation
const predictWithRandomForest = (features: ParkinsonsFeatures): PredictionResult => {
  // Random Forest tends to weigh clinical symptoms slightly differently
  const clinicalScore = 
    (features.tremor * 0.18) + 
    (features.rigidity * 0.17) + 
    (features.bradykinesia * 0.22) + 
    (features.posturalInstability * 0.16) + 
    (features.voiceChanges * 0.12) + 
    (features.handwriting * 0.08);
  
  const ageRisk = features.age > 55 ? (features.age - 55) * 0.04 : 0;
  
  let voiceScore = 0;
  let probability = 0.48; // Slightly different baseline
  
  if (features.mdvpFo && features.mdvpJitter) {
    const jitterImpact = features.mdvpJitter > 0.007 ? 0.16 : 0;
    const foImpact = (features.mdvpFo < 125 || features.mdvpFo > 175) ? 0.12 : 0;
    
    let additionalVoiceScore = 0;
    
    if (features.mdvpShimmer && features.mdvpShimmer > 0.045) {
      additionalVoiceScore += 0.08;
    }
    
    if (features.hnr && features.hnr < 18) {
      additionalVoiceScore += 0.12;
    }
    
    voiceScore = jitterImpact + foImpact + additionalVoiceScore;
    probability = 0.48 + (voiceScore * 0.52);
  }
  
  let advancedScore = 0;
  if (features.spread1 && features.spread1 > -4.8) advancedScore += 0.09;
  if (features.spread2 && features.spread2 > 0.32) advancedScore += 0.11;
  
  // Random forests tend to be less influenced by extreme values
  const totalRisk = Math.min(
    Math.round(((clinicalScore / 10) + ageRisk + voiceScore + advancedScore) * 100), 
    100
  );
  
  const status = totalRisk > 52 ? 1 : 0;
  
  return {
    riskScore: totalRisk,
    probability: probability > 1 ? 1 : probability,
    status,
    modelUsed: 'randomForest',
    confidence: 0.83,
    featureImportance: {
      'bradykinesia': 0.24,
      'tremor': 0.20,
      'rigidity': 0.18,
      'posturalInstability': 0.16,
      'voiceChanges': 0.12,
      'handwriting': 0.06,
      'age': 0.04
    }
  };
};

// Neural Network model simulation
const predictWithNeuralNetwork = (features: ParkinsonsFeatures): PredictionResult => {
  // Neural networks may capture more complex patterns and non-linearities
  const tremor = features.tremor / 10;
  const rigidity = features.rigidity / 10; 
  const bradykinesia = features.bradykinesia / 10; 
  const posturalInstability = features.posturalInstability / 10;
  const voiceChanges = features.voiceChanges / 10;
  const handwriting = features.handwriting / 10;
  const age = (features.age - 50) / 50; // Normalize age
  
  // Simulating neural network activation functions and weighted sums
  const hiddenLayer1 = [
    Math.tanh(0.7*tremor + 0.5*rigidity + 0.8*bradykinesia + 0.3*age + 0.1),
    Math.tanh(0.6*posturalInstability + 0.5*voiceChanges + 0.7*handwriting + 0.2*age - 0.1),
    Math.tanh(0.5*tremor + 0.6*bradykinesia + 0.4*voiceChanges + 0.3*handwriting + 0.2)
  ];
  
  // Output layer (sigmoid function to get probability)
  const output = 1 / (1 + Math.exp(-(1.2*hiddenLayer1[0] + 0.8*hiddenLayer1[1] + hiddenLayer1[2] - 0.4)));
  
  // Voice features add additional nuance to neural network
  let voiceAdjustment = 0;
  if (features.mdvpJitter && features.mdvpShimmer && features.hnr) {
    const jitterNorm = features.mdvpJitter > 0.006 ? 1 : features.mdvpJitter / 0.006;
    const shimmerNorm = features.mdvpShimmer > 0.04 ? 1 : features.mdvpShimmer / 0.04;
    const hnrNorm = features.hnr < 20 ? 1 : 20 / features.hnr;
    
    voiceAdjustment = (jitterNorm * 0.4 + shimmerNorm * 0.3 + hnrNorm * 0.3) * 0.15;
  }
  
  const probability = Math.min(output + voiceAdjustment, 1);
  const riskScore = Math.round(probability * 100);
  
  return {
    riskScore,
    probability,
    status: riskScore > 48 ? 1 : 0, // Neural networks might have slightly different thresholds
    modelUsed: 'neuralNetwork',
    confidence: 0.89,
    featureImportance: {
      'tremor': 0.21,
      'bradykinesia': 0.23,
      'rigidity': 0.16,
      'posturalInstability': 0.14,
      'voiceChanges': 0.13,
      'handwriting': 0.08,
      'age': 0.05
    }
  };
};

// SVM model simulation
const predictWithSVM = (features: ParkinsonsFeatures): PredictionResult => {
  // SVM relies more on the separation between classes using support vectors
  // Using a radial basis function kernel simulation
  
  // Calculate distance from decision boundary (simplified)
  const clinicalVector = 
    (features.tremor * 0.19) + 
    (features.rigidity * 0.18) + 
    (features.bradykinesia * 0.21) + 
    (features.posturalInstability * 0.14) + 
    (features.voiceChanges * 0.13) + 
    (features.handwriting * 0.11);
  
  const ageComponent = features.age > 60 ? 0.06 : 0.03;
  
  // Voice features impact (if available)
  let voiceComponent = 0;
  if (features.mdvpJitter && features.mdvpShimmer) {
    // SVM might use radial basis functions for distance calculation
    const jitterDistance = Math.exp(-Math.pow(features.mdvpJitter - 0.007, 2) / 0.0003);
    const shimmerDistance = Math.exp(-Math.pow(features.mdvpShimmer - 0.045, 2) / 0.0005);
    
    voiceComponent = 0.12 * (jitterDistance + shimmerDistance) / 2;
  }
  
  // Calculate distance from hyperplane (simplified)
  const distanceFromBoundary = (clinicalVector / 10) + ageComponent + voiceComponent - 0.5;
  
  // Convert to probability using a sigmoid function
  const probability = 1 / (1 + Math.exp(-5 * distanceFromBoundary));
  
  const riskScore = Math.min(Math.round(probability * 100), 100);
  
  return {
    riskScore,
    probability,
    status: distanceFromBoundary > 0 ? 1 : 0, // SVM decision boundary
    modelUsed: 'svm',
    confidence: 0.82,
    featureImportance: {
      'bradykinesia': 0.22, 
      'tremor': 0.20,
      'rigidity': 0.19,
      'posturalInstability': 0.14,
      'voiceChanges': 0.13,
      'handwriting': 0.09,
      'age': 0.03
    }
  };
};

// AdaBoost model simulation
const predictWithAdaBoost = (features: ParkinsonsFeatures): PredictionResult => {
  // AdaBoost tends to focus on difficult-to-classify instances
  const clinicalScore = 
    (features.tremor * 0.19) + 
    (features.rigidity * 0.16) + 
    (features.bradykinesia * 0.21) + 
    (features.posturalInstability * 0.15) + 
    (features.voiceChanges * 0.14) + 
    (features.handwriting * 0.09);
  
  const ageRisk = features.age > 58 ? (features.age - 58) * 0.04 : 0;
  
  let voiceScore = 0;
  let probability = 0.47; // Different baseline
  
  if (features.mdvpFo && features.mdvpJitter) {
    const jitterImpact = features.mdvpJitter > 0.007 ? 0.17 : 0;
    const foImpact = (features.mdvpFo < 122 || features.mdvpFo > 178) ? 0.13 : 0;
    
    let additionalVoiceScore = 0;
    
    if (features.mdvpShimmer && features.mdvpShimmer > 0.043) {
      additionalVoiceScore += 0.09;
    }
    
    if (features.hnr && features.hnr < 19) {
      additionalVoiceScore += 0.11;
    }
    
    // AdaBoost is more sensitive to RPDE and DFA
    if (features.rpde && features.rpde > 0.5) {
      additionalVoiceScore += 0.06;
    }
    
    if (features.dfa && features.dfa > 0.7) {
      additionalVoiceScore += 0.07;
    }
    
    voiceScore = jitterImpact + foImpact + additionalVoiceScore;
    probability = 0.47 + (voiceScore * 0.53);
  }
  
  // Combine scores
  const totalRisk = Math.min(
    Math.round(((clinicalScore / 10) + ageRisk + voiceScore) * 100), 
    100
  );
  
  // Clinical decision
  const status = totalRisk > 45 ? 1 : 0; // AdaBoost might have different threshold
  
  // Feature importance for AdaBoost (simulated)
  const featureImportance = {
    'tremor': 0.20,
    'bradykinesia': 0.21,
    'rigidity': 0.16,
    'posturalInstability': 0.15,
    'voiceChanges': 0.14,
    'handwriting': 0.09,
    'age': 0.05
  };
  
  return {
    riskScore: totalRisk,
    probability: probability > 1 ? 1 : probability,
    status,
    modelUsed: 'adaboost',
    confidence: 0.85,
    featureImportance
  };
};

// Extra Trees model simulation
const predictWithExtraTrees = (features: ParkinsonsFeatures): PredictionResult => {
  // Extra Trees is an ensemble method that reduces variance compared to Random Forest
  const clinicalScore = 
    (features.tremor * 0.17) + 
    (features.rigidity * 0.16) + 
    (features.bradykinesia * 0.20) + 
    (features.posturalInstability * 0.17) + 
    (features.voiceChanges * 0.15) + 
    (features.handwriting * 0.10);
  
  const ageRisk = features.age > 56 ? (features.age - 56) * 0.05 : 0;
  
  let voiceScore = 0;
  let probability = 0.50; // Baseline
  
  if (features.mdvpFo && features.mdvpJitter) {
    const jitterImpact = features.mdvpJitter > 0.007 ? 0.15 : 0;
    const foImpact = (features.mdvpFo < 123 || features.mdvpFo > 177) ? 0.12 : 0;
    
    let additionalVoiceScore = 0;
    
    if (features.mdvpShimmer && features.mdvpShimmer > 0.044) {
      additionalVoiceScore += 0.10;
    }
    
    if (features.hnr && features.hnr < 20) {
      additionalVoiceScore += 0.10;
    }
    
    // Extra Trees might be more sensitive to nonlinear measures
    if (features.d2 && features.d2 > 2.4) {
      additionalVoiceScore += 0.05;
    }
    
    if (features.ppe && features.ppe > 0.25) {
      additionalVoiceScore += 0.05;
    }
    
    voiceScore = jitterImpact + foImpact + additionalVoiceScore;
    probability = 0.50 + (voiceScore * 0.50);
  }
  
  // Combine scores
  const totalRisk = Math.min(
    Math.round(((clinicalScore / 10) + ageRisk + voiceScore) * 100), 
    100
  );
  
  // Clinical decision
  const status = totalRisk > 48 ? 1 : 0;
  
  // Feature importance for Extra Trees (simulated)
  const featureImportance = {
    'tremor': 0.17,
    'bradykinesia': 0.20,
    'rigidity': 0.16,
    'posturalInstability': 0.17,
    'voiceChanges': 0.15,
    'handwriting': 0.10,
    'age': 0.05
  };
    return {
    riskScore: totalRisk,
    probability: probability > 1 ? 1 : probability,
    status,
    modelUsed: 'extra_trees',
    confidence: 0.90,
    featureImportance
  };
};

// XGBoost model simulation
const predictWithXGBoost = (features: ParkinsonsFeatures): PredictionResult => {
  // XGBoost typically performs better with large feature sets and mixed data types
  const clinicalScore = 
    (features.tremor * 0.19) + 
    (features.rigidity * 0.17) + 
    (features.bradykinesia * 0.22) + 
    (features.posturalInstability * 0.16) + 
    (features.voiceChanges * 0.14) + 
    (features.handwriting * 0.12);
  
  const ageRisk = features.age > 55 ? (features.age - 55) * 0.06 : 0;
  
  let voiceScore = 0;
  let probability = 0.52; // Slightly better baseline than other models
  
  if (features.mdvpFo && features.mdvpJitter) {
    const jitterImpact = features.mdvpJitter > 0.006 ? 0.17 : 0;
    const foImpact = (features.mdvpFo < 120 || features.mdvpFo > 180) ? 0.14 : 0;
    
    let additionalVoiceScore = 0;
    
    if (features.mdvpShimmer && features.mdvpShimmer > 0.04) {
      additionalVoiceScore += 0.12;
    }
    
    if (features.hnr && features.hnr < 21) {
      additionalVoiceScore += 0.11;
    }
    
    // XGBoost is often good at capturing nonlinear relationships
    if (features.d2 && features.d2 > 2.3) {
      additionalVoiceScore += 0.07;
    }
    
    if (features.ppe && features.ppe > 0.24) {
      additionalVoiceScore += 0.06;
    }
    
    voiceScore = jitterImpact + foImpact + additionalVoiceScore;
    probability = 0.52 + (voiceScore * 0.48);
  }
  
  // Combine scores
  const totalRisk = Math.min(
    Math.round(((clinicalScore / 10) + ageRisk + voiceScore) * 100), 
    100
  );
  
  // Clinical decision
  const status = totalRisk > 45 ? 1 : 0;
  
  // Feature importance for XGBoost (simulated)
  const featureImportance = {
    'tremor': 0.19,
    'bradykinesia': 0.22,
    'rigidity': 0.17,
    'posturalInstability': 0.16,
    'voiceChanges': 0.14,
    'handwriting': 0.12,
    'age': 0.06
  };
  
  return {
    riskScore: totalRisk,
    probability: probability > 1 ? 1 : probability,
    status,
    modelUsed: 'xgboost',
    confidence: 0.91,
    featureImportance
  };
};

// Simulated function to analyze voice recordings and extract MDVP features
export const analyzeVoiceRecording = async (audioBlob: Blob): Promise<{
  mdvpFo: number;
  mdvpFhi: number;
  mdvpFlo: number;
  mdvpJitter: number;
  mdvpShimmer: number;
  nhr: number;
  hnr: number;
}> => {
  // Mock implementation - in reality, this would:
  // 1. Upload the audio file to a Python backend
  // 2. Process it to extract MDVP features using libraries like librosa
  // 3. Return the features for prediction
  
  console.log("Voice analysis would be performed on the backend");
  
  // Randomize slightly to simulate different recordings
  const jitterValue = 0.006 + (Math.random() * 0.002 - 0.001);
  
  return {
    mdvpFo: 154.23 + (Math.random() * 10 - 5),    // Average fundamental frequency
    mdvpFhi: 197.10 + (Math.random() * 10 - 5),   // Maximum fundamental frequency
    mdvpFlo: 116.82 + (Math.random() * 10 - 5),   // Minimum fundamental frequency
    mdvpJitter: jitterValue,                      // Jitter percentage
    mdvpShimmer: 0.04 + (Math.random() * 0.01 - 0.005), // Shimmer percentage (renamed)
    nhr: 0.02 + (Math.random() * 0.01 - 0.005),    // Noise-to-harmonics ratio
    hnr: 21.5 + (Math.random() * 3 - 1.5)         // Harmonics-to-noise ratio
  };
};

// Helper function to extract features from your dataset format
export const extractFeaturesFromDataset = (data: any): ParkinsonsFeatures => {
  return {
    mdvpFo: data["MDVP:Fo(Hz)"],
    mdvpFhi: data["MDVP:Fhi(Hz)"],
    mdvpFlo: data["MDVP:Flo(Hz)"],
    mdvpJitter: data["MDVP:Jitter(%)"],
    mdvpJitterAbs: data["MDVP:Jitter(Abs)"],
    mdvpRAP: data["MDVP:RAP"],
    mdvpPPQ: data["MDVP:PPQ"],
    jitterDDP: data["Jitter:DDP"],
    mdvpShimmer: data["MDVP:Shimmer"],
    mdvpShimmerDB: data["MDVP:Shimmer(dB)"],
    shimmerAPQ3: data["Shimmer:APQ3"],
    shimmerAPQ5: data["Shimmer:APQ5"],
    mdvpAPQ: data["MDVP:APQ"],
    shimmerDDA: data["Shimmer:DDA"],
    nhr: data["NHR"],
    hnr: data["HNR"],
    rpde: data["RPDE"],
    dfa: data["DFA"],
    spread1: data["spread1"],
    spread2: data["spread2"],
    d2: data["D2"],
    ppe: data["PPE"],
    
    // Default clinical features (would be overridden by actual input)
    tremor: 0,
    rigidity: 0,
    bradykinesia: 0,
    posturalInstability: 0,
    voiceChanges: 0,
    handwriting: 0,
    age: 60
  };
};

// Function to determine best model based on features available
export const determineBestModel = (features: ParkinsonsFeatures): ModelType => {
  // In a real implementation, this would use some heuristics or meta-model
  
  // Check how many voice features are available
  const voiceFeatureCount = [
    features.mdvpFo, features.mdvpJitter, features.mdvpShimmer,
    features.nhr, features.hnr, features.rpde, features.dfa,
    features.spread1, features.spread2, features.ppe
  ].filter(Boolean).length;
  
  // Check clinical features strength
  const clinicalScore = 
    features.tremor + 
    features.rigidity + 
    features.bradykinesia + 
    features.posturalInstability + 
    features.voiceChanges + 
    features.handwriting;
  
  if (voiceFeatureCount >= 5) {
    // With rich voice data, neural network tends to perform best
    return 'neuralNetwork';
  } else if (voiceFeatureCount >= 4 && clinicalScore > 25) {
    // With comprehensive data and strong clinical symptoms, XGBoost performs best
    return 'xgboost';
  } else if (voiceFeatureCount >= 2 && clinicalScore > 20) {
    // With moderate voice data and strong symptoms, Gradient Boosting is good
    return 'gradient_boosting';
  } else if (clinicalScore > 30) {
    // With strong clinical features, SVM might be better
    return 'svm';
  } else {
    // In cases with sparse data, random forest is more robust
    return 'randomForest';
  }
};

// Function to get ensemble prediction using multiple models
export const getEnsemblePrediction = (
  features: ParkinsonsFeatures
): PredictionResult & { modelResults: PredictionResult[] } => {  // Get predictions from all models
  const gbResult = predictWithGradientBoosting(features);
  const rfResult = predictWithRandomForest(features);
  const nnResult = predictWithNeuralNetwork(features);
  const svmResult = predictWithSVM(features);
  const adaResult = predictWithAdaBoost(features);
  const etResult = predictWithExtraTrees(features);
  const xgbResult = predictWithXGBoost(features);
  
  const allResults = [gbResult, rfResult, nnResult, svmResult, adaResult, etResult, xgbResult];
  
  // Weighted average based on confidence
  const totalConfidence = allResults.reduce((sum, result) => sum + result.confidence, 0);
  
  const weightedRiskScore = allResults.reduce(
    (sum, result) => sum + (result.riskScore * result.confidence), 
    0
  ) / totalConfidence;
  
  const weightedProbability = allResults.reduce(
    (sum, result) => sum + (result.probability * result.confidence),
    0
  ) / totalConfidence;
  
  // Voting for status with confidence weights
  const weightedStatus = allResults.reduce(
    (sum, result) => sum + (result.status * result.confidence),
    0
  ) / totalConfidence;
  
  // Determine most confident model
  const mostConfidentModel = allResults.reduce(
    (prev, curr) => (curr.confidence > prev.confidence ? curr : prev),
    allResults[0]
  );
    // Ensemble feature importance (weighted average)
  const ensembleFeatureImportance: Record<string, number> = {};
  const featureNames = Object.keys(gbResult.featureImportance || {});
  
  featureNames.forEach(feature => {
    let weightedSum = 0;
    allResults.forEach(result => {
      if (result.featureImportance && result.featureImportance[feature]) {
        weightedSum += result.featureImportance[feature] * result.confidence;
      }
    });
    ensembleFeatureImportance[feature] = weightedSum / totalConfidence;
  });
  
  return {
    riskScore: Math.round(weightedRiskScore),
    probability: weightedProbability,
    status: weightedStatus >= 0.5 ? 1 : 0,
    modelUsed: 'ensemble',
    confidence: (totalConfidence / 4) * 1.05, // Ensemble typically has higher confidence
    featureImportance: ensembleFeatureImportance,
    modelResults: allResults
  };
};
