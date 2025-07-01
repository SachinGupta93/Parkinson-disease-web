import { ref, set, get, getDatabase } from "firebase/database";
import { app } from "@/lib/firebase";
import { ParkinsonsFeatures } from "@/types";
import { UserContext } from "@/App";
import { useContext } from "react";

export interface Assessment {
  id: string;
  date: Date;
  features: ParkinsonsFeatures;
  result: {
    riskScore: number;
    probability: number;
    status: number;
    modelUsed: string;
  };
  voiceRecorded: boolean;
  allModelResults?: {
    modelName: string;
    riskScore: number;
    probability: number;
    confidence: number;
  }[];
  featureImportance?: Record<string, number>;
}

// Use local storage for guests, Firebase for logged in users
const STORAGE_KEY = "parkinsons_assessment_history";
const database = getDatabase(app);

export const saveAssessment = async (
  features: ParkinsonsFeatures, 
  result: Assessment["result"],
  allModelResults?: Assessment["allModelResults"],
  userId?: string
): Promise<string> => {
  const assessmentId = generateId();
  const now = new Date();
  
  const newAssessment: Assessment = {
    id: assessmentId,
    date: now,
    features,
    result,
    voiceRecorded: Boolean(features.mdvpFo && features.mdvpJitter),
    allModelResults
  };
  
  // If user is logged in, save to Firebase with enhanced security
  if (userId && typeof userId === 'string' && userId.trim().length > 0) {
    try {
      console.log("saveAssessment: Attempting to save to Firebase for user:", userId);
      console.log("saveAssessment: Assessment ID:", assessmentId);
      
      const firebaseData = {
        id: assessmentId,
        userId: userId, // Always include userId for verification
        timestamp: now.getTime(),
        type: 'voice_analysis',
        prediction: {
          status: result.status,
          confidence: result.probability,
          severity: result.riskScore,
          model_predictions: allModelResults?.reduce((acc, model) => {
            acc[model.modelName] = model.riskScore;
            return acc;
          }, {} as Record<string, number>) || {},
          model_probabilities: allModelResults?.reduce((acc, model) => {
            acc[model.modelName] = model.probability;
            return acc;
          }, {} as Record<string, number>) || {}
        },
        voice_metrics: {
          pitch: features.mdvpFo || 0,
          jitter: features.mdvpJitter || 0,
          shimmer: features.mdvpShimmer || 0,
          hnr: features.nhr || 0
        },
        features: features,
        recommendations: [],
        // Additional metadata for better organization
        metadata: {
          createdAt: now.toISOString(),
          version: '2.0', // Version for data migration tracking
          source: 'web_app'
        }
      };
      
      console.log("saveAssessment: Secure Firebase data to save:", firebaseData);
      console.log("saveAssessment: Secure Firebase path:", `users/${userId}/assessments/${assessmentId}`);
      
      // Save to both assessments and voiceHistory for backward compatibility
      await set(ref(database, `users/${userId}/assessments/${assessmentId}`), firebaseData);
      await set(ref(database, `users/${userId}/voiceHistory/${assessmentId}`), firebaseData);
      
      console.log("saveAssessment: Successfully saved to secure Firebase paths!");
      
    } catch (error) {
      console.error("saveAssessment: Failed to save assessment to Firebase:", error);
      console.error("saveAssessment: Error details:", {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      
      // Fall back to local storage if Firebase fails
      console.log("saveAssessment: Falling back to local storage");
      saveToLocalStorage(newAssessment);
      
      // Re-throw the error so the calling code knows it failed
      throw error;
    }
  } else {
    console.log("saveAssessment: No user ID provided, saving to local storage");
    // Save to local storage for guests
    saveToLocalStorage(newAssessment);
  }
  
  return assessmentId;
};

const saveToLocalStorage = (assessment: Assessment): void => {
  const history = getLocalAssessmentHistory();
  history.push(assessment);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

export const getAssessmentHistory = async (userId?: string): Promise<Assessment[]> => {
  console.log('getAssessmentHistory called with userId:', userId);
  
  if (!userId) {
    console.log('No userId provided, getting local assessment history');
    return getLocalAssessmentHistory();
  }
  
  try {
    console.log(`getAssessmentHistory: Fetching assessment history from Firebase for user: ${userId}`);
    console.log(`getAssessmentHistory: Firebase path: users/${userId}/voiceHistory`);
    
    const snapshot = await get(ref(database, `users/${userId}/voiceHistory`));
    console.log(`getAssessmentHistory: Snapshot exists: ${snapshot.exists()}`);
    
    if (snapshot.exists()) {
      console.log('getAssessmentHistory: Firebase snapshot exists, processing data');
      const data = snapshot.val();
      console.log('getAssessmentHistory: Raw Firebase data:', data);
      console.log('getAssessmentHistory: Data keys:', Object.keys(data));
      
      const processedData = Object.entries(data).map(([id, assessmentData]: [string, any]) => ({
        id,
        date: new Date(assessmentData.timestamp),
        features: assessmentData.features,
        result: {
          riskScore: assessmentData.prediction.severity,
          probability: assessmentData.prediction.confidence,
          status: assessmentData.prediction.status,
          modelUsed: Object.keys(assessmentData.prediction.model_predictions || {})[0] || "ensemble"
        },
        voiceRecorded: Boolean(
          assessmentData.voice_metrics?.pitch && 
          assessmentData.voice_metrics?.jitter
        ),
        allModelResults: Object.entries(assessmentData.prediction.model_predictions || {}).map(
          ([modelName, score]: [string, number]) => ({
            modelName,
            riskScore: score,
            probability: 0,
            confidence: 0
          })
        )
      }));
      
      console.log('Processed Firebase data:', processedData);
      return processedData;
    }
    
    console.log('No data found in Firebase, returning empty array');
    return []; // Return empty array instead of generating sample data
  } catch (error) {
    console.error("Error retrieving assessment history from Firebase:", error);
    console.log('Falling back to local assessment history');
    return getLocalAssessmentHistory();
  }
};

// Get assessment history from local storage
const getLocalAssessmentHistory = (): Assessment[] => {
  console.log('getLocalAssessmentHistory called');
  
  try {
    const storedHistory = localStorage.getItem(STORAGE_KEY);
    console.log('Raw stored history from localStorage:', storedHistory);
    
    if (!storedHistory) {
      console.log('No stored history found in localStorage');
      return [];
    }
    
    const parsedHistory: Assessment[] = JSON.parse(storedHistory);
    console.log('Parsed history from localStorage:', parsedHistory);
    
    // Process history entries, ensure dates are parsed correctly
    const processedHistory = parsedHistory.map(assessment => ({
      ...assessment,
      date: new Date(assessment.date),
      // No fallback to mock data - use only real data from assessments
      result: assessment.result,
      // Use only real model results, or null if none exist
      allModelResults: assessment.allModelResults && assessment.allModelResults.length > 0 
        ? assessment.allModelResults 
        : null
    }));
    
    console.log('Processed history with patched data:', processedHistory);
    return processedHistory;
  } catch (error) {
    console.error("Error retrieving assessment history from local storage:", error);
    return [];
  }
};

export const clearAssessmentHistory = async (userId?: string): Promise<void> => {
  if (userId) {
    try {
      await set(ref(database, `users/${userId}/voiceHistory`), null);
    } catch (error) {
      console.error("Error clearing assessment history from Firebase:", error);
    }
  }
  localStorage.removeItem(STORAGE_KEY);
};

// Generate a simple unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// These functions have been removed to ensure we only use real data
// No sample data generation or saving of sample data to Firebase

// Calculate progress between assessments
export const calculateProgress = (assessments: Assessment[]): { 
  dates: string[], 
  riskScores: number[],
  mostRecentChange?: {
    value: number, 
    percentage: number, 
    improved: boolean
  }
} => {
  if (assessments.length < 1) {
    return { dates: [], riskScores: [] };
  }
  
  // Sort assessments by date
  const sortedAssessments = [...assessments].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  const dates = sortedAssessments.map(a => a.date.toLocaleDateString());
  const riskScores = sortedAssessments.map(a => a.result.riskScore);
  
  // Calculate most recent change
  if (sortedAssessments.length >= 2) {
    const mostRecent = sortedAssessments[sortedAssessments.length - 1];
    const previous = sortedAssessments[sortedAssessments.length - 2];
    
    const change = mostRecent.result.riskScore - previous.result.riskScore;
    const percentage = Math.abs(change) / previous.result.riskScore * 100;
    const improved = change < 0; // Lower risk score is better
    
    return {
      dates,
      riskScores,
      mostRecentChange: {
        value: Math.abs(change),
        percentage: Math.round(percentage * 10) / 10,
        improved
      }
    };
  }
  
  return { dates, riskScores };
};
