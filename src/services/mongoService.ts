
import toast from "react-hot-toast";

const MONGO_URI_KEY = 'mongodb_uri';

interface MongoDBConfig {
  uri: string;
  isConfigured: boolean;
}

const getMongoConfig = (): MongoDBConfig => {
  // Try to get from environment variables first
  const envUri = import.meta.env.VITE_MONGODB_URI;
  
  if (envUri && envUri.startsWith('mongodb')) {
    return {
      uri: envUri,
      isConfigured: true
    };
  }
  
  // Fall back to localStorage
  const storedUri = localStorage.getItem(MONGO_URI_KEY);
  return {
    uri: storedUri || '',
    isConfigured: Boolean(storedUri && storedUri.startsWith('mongodb'))
  };
};

export const isConfigured = (): boolean => {
  return getMongoConfig().isConfigured;
};

export const getMongoUri = (): string => {
  return getMongoConfig().uri;
};

export const saveMongoConfig = (uri: string): void => {
  if (!uri.startsWith('mongodb')) {
    throw new Error('Invalid MongoDB connection string');
  }
  
  localStorage.setItem(MONGO_URI_KEY, uri);
  toast.success('MongoDB connection saved');
};

export const clearMongoConfig = (): void => {
  localStorage.removeItem(MONGO_URI_KEY);
  toast.success('MongoDB connection removed');
};

export const mongoService = {
  // Fetch dashboard data from MongoDB
  getDashboardData: async () => {
    try {
      const uri = getMongoUri();
      if (!uri) {
        throw new Error('MongoDB not configured');
      }
      
      // In a real application, this would be an API call to a backend service
      // that connects to MongoDB. For now, we'll simulate the response.
      const response = await fetch('/api/dashboard-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uri })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get MongoDB dashboard data:', error);
      return null;
    }
  },
  
  // Get voice analysis history
  getVoiceAnalysisHistory: async () => {
    try {
      // Simulate fetching from MongoDB
      // In a real implementation, this would make an API call to your backend
      return {
        history: [
          {
            id: 'va1',
            timestamp: new Date(),
            severity: 42.5,
            confidence: 0.87,
            voiceMetrics: {
              pitch: 122.5,
              jitter: 0.0042,
              shimmer: 0.0218,
              hnr: 18.3
            },
            recommendations: [
              "Consider speech therapy exercises",
              "Track symptoms over time",
              "Discuss results with healthcare provider"
            ]
          },
          {
            id: 'va2',
            timestamp: new Date(Date.now() - 86400000), // 1 day ago
            severity: 38.9,
            confidence: 0.82,
            voiceMetrics: {
              pitch: 119.8,
              jitter: 0.0038,
              shimmer: 0.0205,
              hnr: 19.1
            },
            recommendations: [
              "Continue voice exercises",
              "Schedule follow-up assessment"
            ]
          },
          {
            id: 'va3',
            timestamp: new Date(Date.now() - 172800000), // 2 days ago
            severity: 45.2,
            confidence: 0.89,
            voiceMetrics: {
              pitch: 124.3,
              jitter: 0.0049,
              shimmer: 0.0236,
              hnr: 17.8
            },
            recommendations: [
              "Consider medication adjustment",
              "Follow up with neurologist",
              "Increase hydration"
            ]
          }
        ]
      };
    } catch (error) {
      console.error('Failed to get voice analysis history:', error);
      return { history: [] };
    }
  },
  
  isConfigured,
  getMongoUri,
  saveMongoConfig,
  clearMongoConfig
};
