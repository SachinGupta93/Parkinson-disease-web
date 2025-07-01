import { ref, set, get, push, query, orderByChild, equalTo, onValue, off } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';

// Standardized interfaces for consistent data structure
export interface StandardVoiceMetrics {
  pitch: number;
  jitter: number;
  shimmer: number;
  hnr: number;
  amplitude?: number;
  frequency?: number;
  tremor?: number;
}

export interface StandardPredictionResult {
  severity: number;
  confidence: number;
  status: boolean;
  modelPredictions: Record<string, number>;
  modelProbabilities: Record<string, number>;
  recommendations: string[];
}

export interface UserVoiceAnalysis {
  id: string;
  userId: string;
  timestamp: number;
  voiceMetrics: StandardVoiceMetrics;
  predictionResult: StandardPredictionResult;
  audioFile?: string; // Optional reference to audio file
}

export interface UserAssessment {
  id: string;
  userId: string;
  timestamp: number;
  type: 'voice_analysis' | 'symptom_check' | 'manual_input';
  data: any;
  result: StandardPredictionResult;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  createdAt: number;
  lastLoginAt?: number;
  preferences?: {
    theme: 'light' | 'dark';
    notifications: boolean;
    dataSharing: boolean;
  };
  medicalInfo?: {
    age?: number;
    gender?: string;
    diagnosisDate?: number;
    medications?: string[];
  };
}

// Validate user ID to prevent cross-user data access
const validateUserId = (userId: string): boolean => {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    console.error('Invalid user ID provided');
    return false;
  }
  return true;
};

// Generate consistent unique IDs
const generateUniqueId = (prefix: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${random}`;
};

// User Profile Management
export class UserProfileService {
  static async saveProfile(userId: string, profile: Partial<UserProfile>): Promise<boolean> {
    try {
      if (!validateUserId(userId)) return false;

      const profileRef = ref(realtimeDb, `users/${userId}/profile`);
      const profileData: UserProfile = {
        userId,
        ...profile,
        lastLoginAt: Date.now(),
      } as UserProfile;

      await set(profileRef, profileData);
      console.log(`Profile saved for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      return false;
    }
  }

  static async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      if (!validateUserId(userId)) return null;

      const profileRef = ref(realtimeDb, `users/${userId}/profile`);
      const snapshot = await get(profileRef);

      if (snapshot.exists()) {
        return snapshot.val() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }
}

// Voice Analysis Data Management
export class VoiceAnalysisService {
  static async saveAnalysis(userId: string, analysis: Omit<UserVoiceAnalysis, 'id' | 'userId'>): Promise<string | null> {
    try {
      if (!validateUserId(userId)) return null;

      const analysisId = generateUniqueId('voice');
      const analysisRef = ref(realtimeDb, `users/${userId}/voiceHistory/${analysisId}`);

      const analysisData: UserVoiceAnalysis = {
        id: analysisId,
        userId,
        ...analysis,
      };

      await set(analysisRef, analysisData);
      console.log(`Voice analysis saved: ${analysisId} for user: ${userId}`);
      
      // Also save to realtime data for live updates
      await this.updateRealtimeData(userId, analysis.voiceMetrics, analysis.predictionResult);
      
      return analysisId;
    } catch (error) {
      console.error('Error saving voice analysis:', error);
      return null;
    }
  }

  static async getAnalysisHistory(userId: string, limit?: number): Promise<UserVoiceAnalysis[]> {
    try {
      if (!validateUserId(userId)) return [];

      const historyRef = ref(realtimeDb, `users/${userId}/voiceHistory`);
      const snapshot = await get(historyRef);

      if (!snapshot.exists()) {
        console.log(`No voice history found for user: ${userId}`);
        return [];
      }

      const data = snapshot.val() as Record<string, UserVoiceAnalysis>;
      let analysisArray = Object.values(data)
        .filter(item => item.userId === userId) // Double-check user isolation
        .sort((a, b) => b.timestamp - a.timestamp);

      if (limit) {
        analysisArray = analysisArray.slice(0, limit);
      }

      console.log(`Retrieved ${analysisArray.length} voice analyses for user: ${userId}`);
      return analysisArray;
    } catch (error) {
      console.error('Error getting voice analysis history:', error);
      return [];
    }
  }

  static async getLatestAnalysis(userId: string): Promise<UserVoiceAnalysis | null> {
    try {
      const history = await this.getAnalysisHistory(userId, 1);
      return history.length > 0 ? history[0] : null;
    } catch (error) {
      console.error('Error getting latest analysis:', error);
      return null;
    }
  }

  static async updateRealtimeData(userId: string, metrics: StandardVoiceMetrics, result?: StandardPredictionResult): Promise<boolean> {
    try {
      if (!validateUserId(userId)) return false;

      const realtimeRef = ref(realtimeDb, `users/${userId}/realtime`);
      const realtimeData = {
        voiceMetrics: metrics,
        predictionResult: result,
        lastUpdated: Date.now(),
        userId, // Ensure user ID is always included
      };

      await set(realtimeRef, realtimeData);
      console.log(`Realtime data updated for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('Error updating realtime data:', error);
      return false;
    }
  }

  static subscribeToRealtimeData(userId: string, callback: (data: any) => void): () => void {
    if (!validateUserId(userId)) {
      return () => {};
    }

    const realtimeRef = ref(realtimeDb, `users/${userId}/realtime`);
    
    const unsubscribe = onValue(realtimeRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Verify this data belongs to the correct user
        if (data.userId === userId) {
          callback(data);
        } else {
          console.warn('Received data for wrong user, ignoring');
        }
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('Realtime data subscription error:', error);
      callback(null);
    });

    return unsubscribe;
  }
}

// Assessment Data Management
export class AssessmentService {
  static async saveAssessment(userId: string, assessment: Omit<UserAssessment, 'id' | 'userId'>): Promise<string | null> {
    try {
      if (!validateUserId(userId)) return null;

      const assessmentId = generateUniqueId('assess');
      const assessmentRef = ref(realtimeDb, `users/${userId}/assessments/${assessmentId}`);

      const assessmentData: UserAssessment = {
        id: assessmentId,
        userId,
        ...assessment,
      };

      await set(assessmentRef, assessmentData);
      console.log(`Assessment saved: ${assessmentId} for user: ${userId}`);
      return assessmentId;
    } catch (error) {
      console.error('Error saving assessment:', error);
      return null;
    }
  }

  static async getAssessmentHistory(userId: string, type?: string, limit?: number): Promise<UserAssessment[]> {
    try {
      if (!validateUserId(userId)) return [];

      const assessmentRef = ref(realtimeDb, `users/${userId}/assessments`);
      const snapshot = await get(assessmentRef);

      if (!snapshot.exists()) {
        console.log(`No assessments found for user: ${userId}`);
        return [];
      }

      const data = snapshot.val() as Record<string, UserAssessment>;
      let assessmentArray = Object.values(data)
        .filter(item => item.userId === userId) // Double-check user isolation
        .filter(item => !type || item.type === type)
        .sort((a, b) => b.timestamp - a.timestamp);

      if (limit) {
        assessmentArray = assessmentArray.slice(0, limit);
      }

      console.log(`Retrieved ${assessmentArray.length} assessments for user: ${userId}`);
      return assessmentArray;
    } catch (error) {
      console.error('Error getting assessment history:', error);
      return [];
    }
  }
}

// Graph Data Management (User-specific)
export class GraphDataService {
  static async saveGraphData(userId: string, graphType: string, data: any): Promise<boolean> {
    try {
      if (!validateUserId(userId)) return false;

      const graphRef = ref(realtimeDb, `graphs/${userId}/${graphType}`);
      const graphData = {
        ...data,
        userId, // Always include user ID
        timestamp: Date.now(),
      };

      await push(graphRef, graphData);
      console.log(`Graph data saved for user: ${userId}, type: ${graphType}`);
      return true;
    } catch (error) {
      console.error('Error saving graph data:', error);
      return false;
    }
  }

  static async getGraphData(userId: string, graphType?: string): Promise<any[]> {
    try {
      if (!validateUserId(userId)) return [];

      const basePath = `graphs/${userId}`;
      const graphRef = graphType 
        ? ref(realtimeDb, `${basePath}/${graphType}`)
        : ref(realtimeDb, basePath);

      const snapshot = await get(graphRef);

      if (!snapshot.exists()) {
        console.log(`No graph data found for user: ${userId}`);
        return [];
      }

      const data = snapshot.val();
      
      if (graphType) {
        // Single graph type
        return Object.values(data)
          .filter((item: any) => item.userId === userId) // Ensure user isolation
          .sort((a: any, b: any) => b.timestamp - a.timestamp);
      } else {
        // All graph types
        const allGraphData: any[] = [];
        Object.keys(data).forEach(type => {
          const typeData = Object.values(data[type])
            .filter((item: any) => item.userId === userId)
            .map((item: any) => ({ ...item, graphType: type }));
          allGraphData.push(...typeData);
        });
        
        return allGraphData.sort((a, b) => b.timestamp - a.timestamp);
      }
    } catch (error) {
      console.error('Error getting graph data:', error);
      return [];
    }
  }
}

// Utility functions
export const UserDataUtils = {
  // Clean up old data (older than specified days)
  async cleanupOldData(userId: string, daysToKeep: number = 90): Promise<boolean> {
    try {
      if (!validateUserId(userId)) return false;

      const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      
      // Clean voice history
      const voiceHistoryRef = ref(realtimeDb, `users/${userId}/voiceHistory`);
      const voiceSnapshot = await get(voiceHistoryRef);
      
      if (voiceSnapshot.exists()) {
        const voiceData = voiceSnapshot.val() as Record<string, UserVoiceAnalysis>;
        const deletePromises: Promise<void>[] = [];
        
        Object.entries(voiceData).forEach(([key, value]) => {
          if (value.timestamp < cutoffTime) {
            deletePromises.push(set(ref(realtimeDb, `users/${userId}/voiceHistory/${key}`), null));
          }
        });
        
        await Promise.all(deletePromises);
      }

      console.log(`Cleaned up old data for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      return false;
    }
  },

  // Export user data for backup/compliance
  async exportUserData(userId: string): Promise<any> {
    try {
      if (!validateUserId(userId)) return null;

      const userRef = ref(realtimeDb, `users/${userId}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        return snapshot.val();
      }
      return null;
    } catch (error) {
      console.error('Error exporting user data:', error);
      return null;
    }
  },

  // Validate data integrity
  async validateUserDataIntegrity(userId: string): Promise<{ isValid: boolean; issues: string[] }> {
    try {
      if (!validateUserId(userId)) {
        return { isValid: false, issues: ['Invalid user ID'] };
      }

      const issues: string[] = [];

      // Check profile exists
      const profile = await UserProfileService.getProfile(userId);
      if (!profile) {
        issues.push('User profile is missing');
      }

      // Check data consistency
      const voiceHistory = await VoiceAnalysisService.getAnalysisHistory(userId);
      voiceHistory.forEach((analysis, index) => {
        if (analysis.userId !== userId) {
          issues.push(`Voice analysis ${index} has incorrect user ID`);
        }
        if (!analysis.voiceMetrics || !analysis.predictionResult) {
          issues.push(`Voice analysis ${index} has incomplete data`);
        }
      });

      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('Error validating user data integrity:', error);
      return { isValid: false, issues: ['Validation failed due to error'] };
    }
  }
};

export default {
  UserProfileService,
  VoiceAnalysisService,
  AssessmentService,
  GraphDataService,
  UserDataUtils
};