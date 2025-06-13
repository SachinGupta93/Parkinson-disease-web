import { database } from '../lib/firebase';
import { ref, push, set, get } from 'firebase/database';
import { useAuth } from '../hooks/useAuth';

interface VoiceMetrics {
  pitch: number;
  jitter: number;
  shimmer: number;
  hnr: number;
  [key: string]: number;
}

interface PredictionResult {
  severity: number;
  confidence: number;
  timestamp: string;
  metrics: VoiceMetrics;
  status?: boolean;
  recommendations?: string[];
  modelDetails?: {
    modelPredictions: Record<string, boolean>;
    modelProbabilities: Record<string, number>;
  };
}

class MLService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  }
  async predictVoiceMetrics(metrics: VoiceMetrics): Promise<PredictionResult> {
    try {
      const apiKey = import.meta.env.VITE_API_KEY || 'your-secure-api-key';
      
      const response = await fetch(`${this.apiUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(metrics),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (response.status === 403) {
          throw new Error('Authentication failed. Please check your API key.');
        }
        throw new Error(`Server error (${response.status}): ${await response.text() || 'Unknown error'}`);
      }

      const data = await response.json();
      
      // Map backend response to our PredictionResult format
      return {
        severity: data.severity,
        confidence: data.confidence,
        timestamp: new Date().toISOString(),
        metrics,
        status: data.status,
        recommendations: data.recommendations || [],
        modelDetails: {
          modelPredictions: data.model_predictions || {},
          modelProbabilities: data.model_probabilities || {}
        }
      };
    } catch (error) {
      console.error('Error getting prediction:', error);
      throw error;
    }
  }
  async saveAnalysisResult(
    userId: string,
    metrics: VoiceMetrics,
    prediction: PredictionResult
  ): Promise<void> {
    try {
      const analysisRef = ref(database, `users/${userId}/analysis_history`);
      const newAnalysisRef = push(analysisRef);
      
      await set(newAnalysisRef, {
        ...prediction,
        metrics,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving analysis result:', error);
      throw error;
    }
  }

  async getAnalysisHistory(userId: string): Promise<PredictionResult[]> {
    try {
      const analysisRef = ref(database, `users/${userId}/analysis_history`);
      const snapshot = await get(analysisRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const history = Object.values(snapshot.val()) as PredictionResult[];
      return history.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error getting analysis history:', error);
      throw error;
    }
  }

  async getLatestAnalysis(userId: string): Promise<PredictionResult | null> {
    try {
      const history = await this.getAnalysisHistory(userId);
      return history[0] || null;
    } catch (error) {
      console.error('Error getting latest analysis:', error);
      throw error;
    }
  }
}

export const mlService = new MLService(); 