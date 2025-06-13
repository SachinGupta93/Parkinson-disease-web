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

// Get user's voice analysis history
export const getUserVoiceHistory = async (userId: string): Promise<VoiceAnalysisData[]> => {
  try {
    if (!userId) {
      return [];
    }
    
    const voiceHistoryRef = ref(realtimeDb, `users/${userId}/voiceHistory`);
    const snapshot = await get(voiceHistoryRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const data = snapshot.val();
    const voiceHistoryArray: VoiceAnalysisData[] = Object.keys(data).map(key => {
      const entry = data[key];
      return {
        userId,
        timestamp: new Date(entry.timestamp),
        voiceMetrics: entry.voiceMetrics || {
          pitch: 0,
          amplitude: 0,
          frequency: 0,
          tremor: 0
        },
        analysisResults: entry.analysisResults ? {
          severity: entry.analysisResults.severity || 0,
          confidence: entry.analysisResults.confidence || 0,
          recommendations: entry.analysisResults.recommendations || [],
          model_predictions: entry.analysisResults.model_predictions || {},
          model_probabilities: entry.analysisResults.model_probabilities || {}
        } : {
          severity: 0,
          confidence: 0,
          recommendations: [],
          model_predictions: {},
          model_probabilities: {}
        }
      };
    });
    
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

// Get real-time graph data
export const getGraphData = async (userId: string): Promise<any[]> => {
  try {
    if (!userId) {
      console.warn("No userId provided when fetching graph data");
      return [];
    }
    
    // Try getting from path with user ID first
    try {
      const graphRef = ref(realtimeDb, `graphs/${userId}`);
      const snapshot = await get(graphRef);
      if (snapshot.exists()) {
        return Object.values(snapshot.val());
      }
    } catch (permissionError) {
      console.warn(`Could not access user-specific graph data: ${permissionError.message}`);
    }
    
    // If specific path fails, try general graphs path
    try {
      const generalGraphRef = ref(realtimeDb, 'graphs');
      const snapshot = await get(generalGraphRef);
      if (snapshot.exists()) {
        const allData = snapshot.val();
        // Try to find data for this user
        if (allData[userId]) {
          return Object.values(allData[userId]);
        }
      }
    } catch (generalError) {
      console.error("Error accessing general graphs data:", generalError);
    }
    
    // Return empty array if no data or permission errors
    return [];
  } catch (error: any) {
    console.error("Error fetching graph data:", error);
    // Return empty instead of throwing, to avoid breaking the UI
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