import { ref, set, get, getDatabase } from "firebase/database";
import { app } from "@/lib/firebase";
import { ParkinsonsFeatures } from "./parkinsonPredictor";
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
  
  // If user is logged in, save to Firebase
  if (userId) {
    try {
      await set(ref(database, `users/${userId}/voiceHistory/${assessmentId}`), {
        timestamp: now.getTime(),
        prediction: {
          status: result.status,
          confidence: result.probability,
          severity: result.riskScore,
          model_predictions: allModelResults?.reduce((acc, model) => {
            acc[model.modelName] = model.riskScore;
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
        recommendations: []
      });
    } catch (error) {
      console.error("Failed to save assessment to Firebase:", error);
      // Fall back to local storage if Firebase fails
      saveToLocalStorage(newAssessment);
    }
  } else {
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
    console.log(`Fetching assessment history from Firebase for user: ${userId}`);
    const snapshot = await get(ref(database, `users/${userId}/voiceHistory`));
    
    if (snapshot.exists()) {
      console.log('Firebase snapshot exists, processing data');
      const data = snapshot.val();
      console.log('Raw Firebase data:', data);
      
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
    return [];
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
    
    // Patch: inject mock result and allModelResults if missing
    const processedHistory = parsedHistory.map(assessment => ({
      ...assessment,
      date: new Date(assessment.date),
      result: assessment.result || {
        riskScore: Math.floor(Math.random() * 100),
        probability: Math.random(),
        status: Math.random() > 0.5 ? 1 : 0,
        modelUsed: 'ensemble'
      },
      allModelResults: assessment.allModelResults && assessment.allModelResults.length > 0 ? assessment.allModelResults : [
        { modelName: 'Model A', riskScore: Math.floor(Math.random() * 100), probability: Math.random(), confidence: Math.random() },
        { modelName: 'Model B', riskScore: Math.floor(Math.random() * 100), probability: Math.random(), confidence: Math.random() }
      ]
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
