import { 
  ParkinsonsFeatures, 
  PredictionResult,
  getEnsemblePrediction,
  predictParkinsonRisk,
} from "@/utils/parkinsonPredictor";
import { toast } from "sonner";

// More realistic mock API base URL
const API_BASE_URL = "https://parkinsons-predictor-api.example.com/api/v1";

// Configuration for API requests
const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'mock-api-key-for-development'
  },
  timeout: 8000 // 8 second timeout
};

// Add random delay to simulate network latency with more realistic patterns
const addNetworkDelay = async () => {
  // Simulate real-world network conditions:
  // - 60% fast response (200-500ms)
  // - 30% medium response (500-1500ms)
  // - 10% slow response (1500-3000ms)
  const random = Math.random();
  let delay: number;
  
  if (random < 0.6) {
    delay = Math.floor(Math.random() * 300) + 200; // 200-500ms
  } else if (random < 0.9) {
    delay = Math.floor(Math.random() * 1000) + 500; // 500-1500ms
  } else {
    delay = Math.floor(Math.random() * 1500) + 1500; // 1500-3000ms
  }
  
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Mock server-side errors with different status codes and messages
class APIError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'APIError';
  }
}

// More realistic error simulation
const simulateNetworkConditions = async () => {
  const random = Math.random();
  
  // 5% chance of network error
  if (random < 0.05) {
    throw new APIError("Network Error: Unable to connect to server", 0);
  }
  
  // 3% chance of server error
  if (random < 0.08) {
    throw new APIError("Internal Server Error", 500);
  }
  
  // 2% chance of timeout
  if (random < 0.10) {
    throw new APIError("Request timed out", 408);
  }
};

// Mock API endpoints with more realistic structure
export const enhancedMockFastAPI = {
  // User authentication endpoints
  auth: {
    login: async (email: string, password: string) => {
      try {
        console.log(`[API] POST ${API_BASE_URL}/auth/login`);
        await addNetworkDelay();
        await simulateNetworkConditions();
        
        if (!email || !password) {
          throw new APIError("Email and password are required", 400);
        }
        
        // Mock successful login
        return {
          user: {
            id: "user-" + Math.random().toString(36).substring(2, 9),
            email,
            name: email.split('@')[0],
            role: "user"
          },
          token: "mock-jwt-token-" + Math.random().toString(36).substring(2)
        };
      } catch (error) {
        console.error("[API] Login error:", error);
        if (error instanceof APIError) {
          toast.error(`Login failed: ${error.message} (${error.status})`);
        } else {
          toast.error("Login failed. Please try again.");
        }
        throw error;
      }
    },
    
    register: async (name: string, email: string, password: string) => {
      try {
        console.log(`[API] POST ${API_BASE_URL}/auth/register`);
        await addNetworkDelay();
        await simulateNetworkConditions();
        
        if (!name || !email || !password) {
          throw new APIError("All fields are required", 400);
        }
        
        if (password.length < 8) {
          throw new APIError("Password must be at least 8 characters", 400);
        }
        
        // Mock successful registration
        return {
          user: {
            id: "user-" + Math.random().toString(36).substring(2, 9),
            email,
            name,
            role: "user"
          },
          token: "mock-jwt-token-" + Math.random().toString(36).substring(2)
        };
      } catch (error) {
        console.error("[API] Registration error:", error);
        if (error instanceof APIError) {
          toast.error(`Registration failed: ${error.message} (${error.status})`);
        } else {
          toast.error("Registration failed. Please try again.");
        }
        throw error;
      }
    }
  },
  
  // Prediction API endpoints
  predictions: {
    // Get prediction from "backend" models
    predict: async (
      features: ParkinsonsFeatures
    ): Promise<PredictionResult & { allModelResults?: PredictionResult[] }> => {
      try {
        console.log(`[API] POST ${API_BASE_URL}/predictions/analyze`);
        console.log("Request payload:", features);
        
        await addNetworkDelay();
        await simulateNetworkConditions();
        
        // In a real app, this would send features to a Python FastAPI backend
        // with trained machine learning models
        
        // Get prediction from ensemble model
        const ensembleResult = getEnsemblePrediction(features);
        const gbResult = predictParkinsonRisk(features, 'gradient_boosting');
        const rfResult = predictParkinsonRisk(features, 'randomForest');
        const nnResult = predictParkinsonRisk(features, 'neuralNetwork');
        const svmResult = predictParkinsonRisk(features, 'svm');
        const adaResult = predictParkinsonRisk(features, 'adaboost');
        const etResult = predictParkinsonRisk(features, 'extra_trees');
        const xgboostResult = predictParkinsonRisk(features, 'xgboost');
        
        const allModelResults = [gbResult, rfResult, nnResult, svmResult, adaResult, etResult, xgboostResult];
        
        console.log("[API] Prediction response:", ensembleResult);
        
        return {
          ...ensembleResult,
          allModelResults
        };
      } catch (error) {
        console.error("[API] Prediction error:", error);
        
        if (error instanceof APIError && error.status === 0) {
          toast.error("Cannot connect to prediction service. Using fallback prediction.");
        } else {
          toast.error("Prediction service error. Using fallback prediction.");
        }
        
        // Fallback to client-side prediction if API fails
        const fallbackResult = getEnsemblePrediction(features);
        return fallbackResult;
      }
    },
    
    // Save a prediction to user history
    saveToHistory: async (userId: string, prediction: any) => {
      try {
        console.log(`[API] POST ${API_BASE_URL}/users/${userId}/history`);
        console.log("Request payload:", prediction);
        
        await addNetworkDelay();
        await simulateNetworkConditions();
        
        // Mock successful save
        return {
          id: "history-" + Math.random().toString(36).substring(2, 9),
          userId,
          prediction,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error("[API] Save to history error:", error);
        toast.error("Failed to save assessment to history. Saved locally instead.");
        throw error;
      }
    },
    
    // Get prediction history for a user
    getHistory: async (userId: string) => {
      try {
        console.log(`[API] GET ${API_BASE_URL}/users/${userId}/history`);
        await addNetworkDelay();
        await simulateNetworkConditions();
        // Patch: Return valid mock data for graphs
        const demoFeatures = {
          tremor: 2,
          rigidity: 3,
          bradykinesia: 4,
          posturalInstability: 1,
          voiceChanges: 2,
          handwriting: 3,
          age: 65,
          mdvpFo: 120,
          mdvpJitter: 0.005,
          mdvpShimmer: 0.03,
          hnr: 18,
          nhr: 0.02,
          spread1: -5.2,
          spread2: 0.31,
          ppe: 0.21,
          rpde: 0.45,
          dfa: 0.65,
          d2: 2.1
        };
        return [
          {
            id: 'mock-1',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
            features: { ...demoFeatures, tremor: 2, rigidity: 3 },
            result: { riskScore: 30, probability: 0.3, status: 0, modelUsed: 'ensemble' },
            allModelResults: [
              { modelName: 'Model A', riskScore: 30, probability: 0.3, confidence: 0.8 },
              { modelName: 'Model B', riskScore: 40, probability: 0.4, confidence: 0.7 }
            ]
          },
          {
            id: 'mock-2',
            date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
            features: { ...demoFeatures, tremor: 4, rigidity: 5 },
            result: { riskScore: 55, probability: 0.6, status: 1, modelUsed: 'ensemble' },
            allModelResults: [
              { modelName: 'Model A', riskScore: 55, probability: 0.6, confidence: 0.85 },
              { modelName: 'Model B', riskScore: 60, probability: 0.7, confidence: 0.75 }
            ]
          },
          {
            id: 'mock-3',
            date: new Date(),
            features: { ...demoFeatures, tremor: 7, rigidity: 6 },
            result: { riskScore: 80, probability: 0.9, status: 1, modelUsed: 'ensemble' },
            allModelResults: [
              { modelName: 'Model A', riskScore: 80, probability: 0.9, confidence: 0.9 },
              { modelName: 'Model B', riskScore: 75, probability: 0.85, confidence: 0.8 }
            ]
          }
        ];
      } catch (error) {
        console.error("[API] Get history error:", error);
        toast.error("Failed to retrieve assessment history.");
        throw error;
      }
    }
  },
  
  // Voice analysis API endpoints
  voice: {
    // Analyze voice recording
    analyze: async (audioBlob: Blob) => {
      try {
        console.log(`[API] POST ${API_BASE_URL}/voice/analyze`);
        
        // Voice analysis would take longer
        await addNetworkDelay();
        await addNetworkDelay(); // Extra delay for voice processing
        await simulateNetworkConditions();
        
        // In a real app, this would upload the audio file to a Python backend
        // that uses libraries like librosa to extract features
        
        // Generate more diverse random values for realistic simulation
        const randomInRange = (min: number, max: number) => {
          return min + Math.random() * (max - min);
        };
        
        // Simulate natural variability in voice metrics
        const jitterValue = randomInRange(0.005, 0.008);
        const shimmerValue = randomInRange(0.035, 0.045);
        
        const voiceFeatures = {
          mdvpFo: randomInRange(145, 165),
          mdvpFhi: randomInRange(190, 205),
          mdvpFlo: randomInRange(110, 125),
          mdvpJitter: jitterValue,
          mdvpShimmer: shimmerValue,
          nhr: randomInRange(0.015, 0.025),
          hnr: randomInRange(19, 24),
          rpde: randomInRange(0.45, 0.55),
          dfa: randomInRange(0.65, 0.75),
          spread1: randomInRange(-6, -5),
          spread2: randomInRange(0.15, 0.25),
          d2: randomInRange(2.2, 2.4),
          ppe: randomInRange(0.18, 0.22)
        };
        
        console.log("[API] Voice analysis response:", voiceFeatures);
        
        return voiceFeatures;
      } catch (error) {
        console.error("[API] Voice analysis error:", error);
        toast.error("Failed to analyze voice recording. Please try again.");
        throw error;
      }
    }
  },
  
  // Educational resources API endpoint
  resources: {
    // Get educational resources
    getAll: async () => {
      try {
        console.log(`[API] GET ${API_BASE_URL}/resources`);
        
        await addNetworkDelay();
        await simulateNetworkConditions();
        
        // Mock educational resources that would come from a backend
        return [
          {
            id: "pd-overview",
            title: "Understanding Parkinson's Disease",
            description: "An overview of Parkinson's disease, its causes, symptoms, and treatments.",
            url: "/resources/parkinsons-overview",
            imageUrl: "https://placehold.co/600x400?text=Parkinson's+Disease",
            category: "information"
          },
          {
            id: "early-signs",
            title: "Early Signs and Symptoms",
            description: "Recognizing the early warning signs of Parkinson's disease.",
            url: "/resources/early-signs",
            imageUrl: "https://placehold.co/600x400?text=Early+Signs",
            category: "symptoms"
          },
          {
            id: "treatment-options",
            title: "Treatment Options",
            description: "Current treatments and therapies for managing Parkinson's disease.",
            url: "/resources/treatments",
            imageUrl: "https://placehold.co/600x400?text=Treatment+Options",
            category: "treatment"
          },
          {
            id: "research-advances",
            title: "Research and Advances",
            description: "Latest research and advances in Parkinson's disease.",
            url: "/resources/research-advances",
            imageUrl: "https://placehold.co/600x400?text=Research+Advances",
            category: "research"
          },
          {
            id: "support-groups",
            title: "Support Groups",
            description: "Finding and joining Parkinson's disease support groups.",
            url: "/resources/support-groups",
            imageUrl: "https://placehold.co/600x400?text=Support+Groups",
            category: "support"
          },
          {
            id: "caregiving",
            title: "Caregiving for Parkinson's Patients",
            description: "Tips and resources for caregivers of people with Parkinson's disease.",
            url: "/resources/caregiving",
            imageUrl: "https://placehold.co/600x400?text=Caregiving",
            category: "support"
          }
        ];
      } catch (error) {
        console.error("[API] Get resources error:", error);
        toast.error("Failed to load educational resources.");
        return [];
      }
    },
    
    // Get resource by ID
    getById: async (id: string) => {
      try {
        console.log(`[API] GET ${API_BASE_URL}/resources/${id}`);
        
        await addNetworkDelay();
        await simulateNetworkConditions();
        
        // Mock resource details
        return {
          id,
          title: "Understanding Parkinson's Disease",
          description: "An overview of Parkinson's disease, its causes, symptoms, and treatments.",
          content: "# Parkinson's Disease\n\nParkinson's disease is a neurodegenerative disorder that affects movement. Symptoms start gradually, sometimes starting with a barely noticeable tremor in just one hand. Tremors are common, but the disorder also commonly causes stiffness or slowing of movement.",
          imageUrl: "https://placehold.co/800x400?text=Parkinson's+Disease",
          category: "information",
          published: "2023-04-15",
          author: "Dr. Jane Smith"
        };
      } catch (error) {
        console.error(`[API] Get resource ${id} error:`, error);
        toast.error("Failed to load resource details.");
        throw error;
      }
    }
  }
};
export default enhancedMockFastAPI;
