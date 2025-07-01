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
    
    // Generate a unique ID for the entry
    const timestamp = Date.now();
    const uniqueId = `va_${timestamp}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Save to Realtime Database
    const realtimeRef = ref(realtimeDb, `users/${userId}/voiceHistory/${uniqueId}`);
    await set(realtimeRef, {
      id: uniqueId,
      userId,
      ...data,
      timestamp: data.timestamp.getTime()
    });
    
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