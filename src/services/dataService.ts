import { ref, set, get, push, query, orderByChild, equalTo } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

export interface VoiceAnalysisData {
  userId: string;
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
    model_predictions?: Record<string, number>; 
    model_probabilities?: Record<string, number>; 
  };
}

export interface UserHistory {
  id: string;
  userId: string;
  date: Date;
  type: 'voice_analysis' | 'symptom_check' | 'medication';
  data: any;
}

// Save voice analysis data
export const saveVoiceAnalysis = async (userId: string, data: Omit<VoiceAnalysisData, 'userId'>): Promise<string> => {
  try {
    if (!userId) {
      throw new Error('User ID is required to save voice analysis data');
    }
    
    if (!realtimeDb) {
      throw new Error('Firebase database is not initialized');
    }
    
    // Generate a unique ID for the entry
    const timestamp = Date.now();
    const uniqueId = `va_${timestamp}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Validate data before saving to avoid zero values
    const validatedData = {
      id: uniqueId,
      userId,
      timestamp: data.timestamp.getTime(),
      voiceMetrics: {
        pitch: typeof data.voiceMetrics.pitch === 'number' && !isNaN(data.voiceMetrics.pitch) ? data.voiceMetrics.pitch : 0,
        amplitude: typeof data.voiceMetrics.amplitude === 'number' && !isNaN(data.voiceMetrics.amplitude) ? data.voiceMetrics.amplitude : 0,
        frequency: typeof data.voiceMetrics.frequency === 'number' && !isNaN(data.voiceMetrics.frequency) ? data.voiceMetrics.frequency : 0,
        tremor: typeof data.voiceMetrics.tremor === 'number' && !isNaN(data.voiceMetrics.tremor) ? data.voiceMetrics.tremor : 0,
      },
      analysisResults: {
        severity: typeof data.analysisResults.severity === 'number' && !isNaN(data.analysisResults.severity) ? data.analysisResults.severity : 0,
        confidence: typeof data.analysisResults.confidence === 'number' && !isNaN(data.analysisResults.confidence) ? data.analysisResults.confidence : 0,
        recommendations: Array.isArray(data.analysisResults.recommendations) ? data.analysisResults.recommendations : [],
        model_predictions: data.analysisResults.model_predictions || {},
        model_probabilities: data.analysisResults.model_probabilities || {}
      }
    };
    
    // Save to Realtime Database
    const realtimeRef = ref(realtimeDb, `users/${userId}/voiceHistory/${uniqueId}`);
    await set(realtimeRef, validatedData);
    
    console.log('Voice analysis saved successfully:', uniqueId);
    return uniqueId;
  } catch (error: any) {
    console.error("Error saving voice analysis:", error);
    throw new Error(`Failed to save voice analysis: ${error.message}`);
  }
};

// Define interfaces for Firebase data structure
interface FirebaseVoiceMetrics {
  pitch?: number;
  jitter?: number;
  shimmer?: number;
  hnr?: number;
  [key: string]: any;
}

interface FirebasePrediction {
  severity?: number;
  confidence?: number;
  status?: boolean;
  model_predictions?: Record<string, number>;
  model_probabilities?: Record<string, number>;
  [key: string]: any;
}

interface FirebaseVoiceHistoryEntry {
  timestamp: number;
  voice_metrics?: FirebaseVoiceMetrics;
  voiceMetrics?: FirebaseVoiceMetrics;
  prediction?: FirebasePrediction;
  analysisResults?: {
    severity?: number;
    confidence?: number;
    recommendations?: string[];
    model_predictions?: Record<string, number>;
    model_probabilities?: Record<string, number>;
  };
  recommendations?: string[];
  [key: string]: any;
}

// Get user's voice analysis history
export const getUserVoiceHistory = async (userId: string): Promise<VoiceAnalysisData[]> => {
  try {
    if (!userId) {
      console.log("getUserVoiceHistory: No userId provided");
      return [];
    }
    
    console.log(`getUserVoiceHistory: Fetching data for user ${userId}`);
    const voiceHistoryRef = ref(realtimeDb, `users/${userId}/voiceHistory`);
    const snapshot = await get(voiceHistoryRef);
    
    if (!snapshot.exists()) {
      console.log(`getUserVoiceHistory: No data found for user ${userId}`);
      return [];
    }
    
    const data = snapshot.val() as Record<string, FirebaseVoiceHistoryEntry>;
    console.log(`getUserVoiceHistory: Raw data:`, data);
    
    const voiceHistoryArray: VoiceAnalysisData[] = Object.keys(data).map(key => {
      const entry = data[key];
      console.log(`getUserVoiceHistory: Processing entry ${key}:`, entry);
      
      // Handle different data structures
      // Some entries might have prediction and voice_metrics at the top level
      // Others might have them nested in voiceMetrics and analysisResults
      
      // Extract voice metrics
      let voiceMetrics: VoiceAnalysisData['voiceMetrics'];
      if (entry.voice_metrics) {
        // Firebase structure: entry.voice_metrics
        voiceMetrics = {
          pitch: typeof entry.voice_metrics.pitch === 'number' ? entry.voice_metrics.pitch : 0,
          amplitude: typeof entry.voice_metrics.shimmer === 'number' ? entry.voice_metrics.shimmer : 0,
          frequency: typeof entry.voice_metrics.hnr === 'number' ? entry.voice_metrics.hnr : 0,
          tremor: typeof entry.voice_metrics.jitter === 'number' ? entry.voice_metrics.jitter : 0
        };
      } else if (entry.voiceMetrics) {
        // Alternative structure: entry.voiceMetrics
        voiceMetrics = {
          pitch: typeof entry.voiceMetrics.pitch === 'number' ? entry.voiceMetrics.pitch : 0,
          amplitude: typeof entry.voiceMetrics.amplitude === 'number' ? entry.voiceMetrics.amplitude : 0,
          frequency: typeof entry.voiceMetrics.frequency === 'number' ? entry.voiceMetrics.frequency : 0,
          tremor: typeof entry.voiceMetrics.tremor === 'number' ? entry.voiceMetrics.tremor : 0
        };
      } else {
        // No voice metrics found
        voiceMetrics = {
          pitch: 0,
          amplitude: 0,
          frequency: 0,
          tremor: 0
        };
      }
      
      // Extract analysis results
      let analysisResults: VoiceAnalysisData['analysisResults'];
      if (entry.prediction) {
        // Firebase structure: entry.prediction
        const prediction = entry.prediction;
        analysisResults = {
          severity: typeof prediction.severity === 'number' ? prediction.severity : 0,
          confidence: typeof prediction.confidence === 'number' ? prediction.confidence : 0,
          recommendations: Array.isArray(entry.recommendations) ? entry.recommendations : [],
          model_predictions: prediction.model_predictions || {},
          model_probabilities: prediction.model_probabilities || {}
        };
      } else if (entry.analysisResults) {
        // Alternative structure: entry.analysisResults
        const results = entry.analysisResults;
        analysisResults = {
          severity: typeof results.severity === 'number' ? results.severity : 0,
          confidence: typeof results.confidence === 'number' ? results.confidence : 0,
          recommendations: Array.isArray(results.recommendations) ? results.recommendations : [],
          model_predictions: results.model_predictions || {},
          model_probabilities: results.model_probabilities || {}
        };
      } else {
        // No analysis results found
        analysisResults = {
          severity: 0,
          confidence: 0,
          recommendations: [],
          model_predictions: {},
          model_probabilities: {}
        };
      }
      
      console.log(`getUserVoiceHistory: Processed metrics:`, voiceMetrics);
      console.log(`getUserVoiceHistory: Processed results:`, analysisResults);
      
      return {
        userId,
        timestamp: new Date(entry.timestamp),
        voiceMetrics,
        analysisResults
      };
    });
    
    console.log(`getUserVoiceHistory: Final processed data (${voiceHistoryArray.length} entries):`, voiceHistoryArray);
    
    return voiceHistoryArray.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  } catch (error: any) {
    console.error("Error getting voice history:", error);
    return []; // Return empty array on error
  }
};

// Save real-time graph data
export const saveGraphData = async (userId: string, data: any): Promise<void> => {
  try {
    const graphRef = ref(realtimeDb, `graphs/${userId}`);
    await push(graphRef, {
      ...data,
      timestamp: Date.now()
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Get real-time graph data - USER ISOLATED VERSION
export const getGraphData = async (userId: string): Promise<any[]> => {
  try {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      console.warn("Invalid userId provided when fetching graph data");
      return [];
    }
    
    console.log(`getGraphData: Fetching secure graph data for user ${userId}`);
    
    // Only access user-specific path - NO FALLBACK to general path to prevent cross-user access
    const userGraphRef = ref(realtimeDb, `graphs/${userId}`);
    const snapshot = await get(userGraphRef);
    
    if (snapshot.exists()) {
      const graphData = snapshot.val();
      const graphArray = Object.values(graphData)
        .filter((item: any) => item.userId === userId) // Double-check user isolation
        .sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));
      
      console.log(`getGraphData: Retrieved ${graphArray.length} secure graph entries for user ${userId}`);
      return graphArray;
    }
    
    console.log(`getGraphData: No graph data found for user ${userId}`);
    return [];
  } catch (error: any) {
    console.error(`getGraphData: Error fetching graph data for user ${userId}:`, error);
    // Return empty array to prevent breaking UI, but log the actual error
    return [];
  }
};

// Save user history
export const saveUserHistory = async (history: Omit<UserHistory, 'id'>): Promise<string> => {
  try {
    if (!history.userId) {
      throw new Error('User ID is required to save history');
    }
    
    // Generate a unique ID for the entry
    const timestamp = Date.now();
    const uniqueId = `hist_${timestamp}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Save to Realtime Database
    const historyRef = ref(realtimeDb, `users/${history.userId}/history/${uniqueId}`);
    await set(historyRef, {
      id: uniqueId,
      ...history,
      date: history.date.getTime()
    });
    
    return uniqueId;
  } catch (error: any) {
    console.error("Error saving user history:", error);
    throw new Error(error.message);
  }
};

// Get user history
export const getUserHistory = async (userId: string): Promise<UserHistory[]> => {
  try {
    if (!userId) {
      return [];
    }
    
    const historyRef = ref(realtimeDb, `users/${userId}/history`);
    const snapshot = await get(historyRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    // Convert the data to the expected format
    const data = snapshot.val();
    const historyArray: UserHistory[] = Object.keys(data).map(key => {
      const entry = data[key];
      return {
        id: key,
        userId,
        date: new Date(entry.date),
        type: entry.type || 'voice_analysis',
        data: entry.data
      };
    });
      // Sort by date descending
    return historyArray.sort((a, b) => 
      b.date.getTime() - a.date.getTime()
    );
  } catch (error: any) {
    console.error("Error getting user history:", error);
    return [];
  }
};

// Interface for multi-model predictions
export interface MultiModelPredictionData {
  userId: string;
  timestamp: Date;
  voiceFeatures: {
    [key: string]: number;
  };
  modelResults: {
    [modelName: string]: {
      prediction: number;
      probability: number;
      confidence?: number;
      feature_importance?: Record<string, number>;
    };
  };
  summary: {
    consensus_prediction: number;
    average_probability: number;
    total_models: number;
    agreement_ratio: number;
  };
}

// Save multi-model prediction results
export const saveMultiModelPrediction = async (
  userId: string, 
  data: Omit<MultiModelPredictionData, 'userId'>
): Promise<string> => {
  try {
    if (!userId) {
      throw new Error('User ID is required to save multi-model prediction data');
    }
    
    if (!realtimeDb) {
      throw new Error('Firebase database is not initialized');
    }
    
    // Generate a unique ID for the entry
    const timestamp = Date.now();
    const uniqueId = `mmp_${timestamp}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Validate and clean the data
    const validatedData = {
      id: uniqueId,
      userId,
      timestamp: data.timestamp.getTime(),
      voiceFeatures: data.voiceFeatures || {},
      modelResults: data.modelResults || {},
      summary: {
        consensus_prediction: typeof data.summary?.consensus_prediction === 'number' ? data.summary.consensus_prediction : 0,
        average_probability: typeof data.summary?.average_probability === 'number' ? data.summary.average_probability : 0,
        total_models: typeof data.summary?.total_models === 'number' ? data.summary.total_models : 0,
        agreement_ratio: typeof data.summary?.agreement_ratio === 'number' ? data.summary.agreement_ratio : 0,
      }
    };
    
    // Save to multiple paths for better data organization
    const multiModelRef = ref(realtimeDb, `users/${userId}/multiModelPredictions/${uniqueId}`);
    const modelResultsRef = ref(realtimeDb, `modelResults/${userId}/${uniqueId}`);
    
    // Save to both locations
    await Promise.all([
      set(multiModelRef, validatedData),
      set(modelResultsRef, validatedData)
    ]);
    
    console.log('Multi-model prediction saved successfully:', uniqueId);
    return uniqueId;
  } catch (error: any) {
    console.error("Error saving multi-model prediction:", error);
    throw new Error(`Failed to save multi-model prediction: ${error.message}`);
  }
};

// Get user's multi-model predictions
export const getUserMultiModelPredictions = async (userId: string): Promise<MultiModelPredictionData[]> => {
  try {
    if (!userId) {
      console.log("getUserMultiModelPredictions: No userId provided");
      return [];
    }
    
    console.log(`getUserMultiModelPredictions: Fetching data for user ${userId}`);
    const predictionsRef = ref(realtimeDb, `users/${userId}/multiModelPredictions`);
    const snapshot = await get(predictionsRef);
    
    if (!snapshot.exists()) {
      console.log(`getUserMultiModelPredictions: No data found for user ${userId}`);
      return [];
    }
    
    const data = snapshot.val() as Record<string, any>;
    console.log(`getUserMultiModelPredictions: Raw data:`, data);
    
    const predictionsArray: MultiModelPredictionData[] = Object.keys(data).map(key => {
      const entry = data[key];
      
      return {
        userId,
        timestamp: new Date(entry.timestamp),
        voiceFeatures: entry.voiceFeatures || {},
        modelResults: entry.modelResults || {},
        summary: {
          consensus_prediction: entry.summary?.consensus_prediction || 0,
          average_probability: entry.summary?.average_probability || 0,
          total_models: entry.summary?.total_models || 0,
          agreement_ratio: entry.summary?.agreement_ratio || 0,
        }
      };
    });
    
    console.log(`getUserMultiModelPredictions: Processed ${predictionsArray.length} entries`);
    
    return predictionsArray.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  } catch (error: any) {
    console.error("Error getting multi-model predictions:", error);
    return [];
  }
};