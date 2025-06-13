
import { 
  ParkinsonsFeatures, 
  PredictionResult,
  getEnsemblePrediction,
  predictParkinsonRisk,
} from "@/utils/parkinsonPredictor";
import { toast } from "sonner";

// Mock API base URL (would be a real API endpoint in production)
const API_BASE_URL = "https://mock-parkinsons-api.example";

// Add random delay to simulate network latency
const addDelay = async (min = 500, max = 1500) => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Mock API error simulation (20% chance of error)
const simulateNetworkConditions = async () => {
  // 20% chance of error
  if (Math.random() < 0.1) {
    throw new Error("Network error: Failed to connect to API");
  }
};

// Mock API endpoints
export const mockFastAPI = {
  // Get prediction from "backend" model
  getPrediction: async (
    features: ParkinsonsFeatures
  ): Promise<PredictionResult & { allModelResults?: PredictionResult[] }> => {
    try {
      console.log("Sending features to FastAPI backend:", features);
      
      await addDelay();
      await simulateNetworkConditions();
      
      // In a real app, this would be an actual API call to a Python FastAPI backend
      // that runs the machine learning model
      const ensembleResult = getEnsemblePrediction(features);
        // Get individual model results      const gbResult = predictParkinsonRisk(features, 'gradient_boosting');
      const rfResult = predictParkinsonRisk(features, 'randomForest');
      const nnResult = predictParkinsonRisk(features, 'neuralNetwork');
      const svmResult = predictParkinsonRisk(features, 'svm');
      const adaResult = predictParkinsonRisk(features, 'adaboost');
      const etResult = predictParkinsonRisk(features, 'extra_trees');
      const xgboostResult = predictParkinsonRisk(features, 'xgboost');
      
      const allModelResults = [rfResult, nnResult, svmResult, adaResult, etResult, xgboostResult];
      
      console.log("Received prediction from FastAPI backend:", ensembleResult);
      
      return {
        ...ensembleResult,
        allModelResults
      };
    } catch (error) {
      console.error("Failed to get prediction:", error);
      toast.error("Failed to connect to prediction service. Using fallback prediction.");
      
      // Fallback to client-side prediction if API fails
      const fallbackResult = getEnsemblePrediction(features);
      return fallbackResult;
    }
  },
  
  // Analyze voice recording on "backend"
  analyzeVoice: async (audioBlob: Blob) => {
    try {
      console.log("Sending voice recording to FastAPI backend for analysis");
      
      await addDelay(1000, 2500); // Voice analysis would take longer
      await simulateNetworkConditions();
      
      // In a real app, this would upload the audio file to a Python backend
      // that uses libraries like librosa to extract features
      
      // This is the same simulation as in the parkinsonPredictor.ts file,
      // but pretending it came from the backend
      const jitterValue = 0.006 + (Math.random() * 0.002 - 0.001);
      
      const voiceFeatures = {
        mdvpFo: 154.23 + (Math.random() * 10 - 5),
        mdvpFhi: 197.10 + (Math.random() * 10 - 5), 
        mdvpFlo: 116.82 + (Math.random() * 10 - 5), 
        mdvpJitter: jitterValue,  
        mdvpShimmer: 0.04 + (Math.random() * 0.01 - 0.005),
        nhr: 0.02 + (Math.random() * 0.01 - 0.005),
        hnr: 21.5 + (Math.random() * 3 - 1.5),
        rpde: 0.5 + (Math.random() * 0.1 - 0.05),
        dfa: 0.7 + (Math.random() * 0.1 - 0.05),
        spread1: -5.5 + (Math.random() * 1 - 0.5),
        spread2: 0.2 + (Math.random() * 0.1 - 0.05),
        d2: 2.3 + (Math.random() * 0.2 - 0.1),
        ppe: 0.2 + (Math.random() * 0.05 - 0.025)
      };
      
      console.log("Received voice analysis from FastAPI backend:", voiceFeatures);
      
      return voiceFeatures;
    } catch (error) {
      console.error("Failed to analyze voice recording:", error);
      toast.error("Failed to analyze voice recording. Please try again.");
      throw error;
    }
  },
  
  // Get educational resources
  getEducationalResources: async () => {
    try {
      await addDelay();
      await simulateNetworkConditions();
      
      // Mock educational resources that would come from a backend
      return [
        {
          id: "pd-overview",
          title: "Understanding Parkinson's Disease",
          description: "An overview of Parkinson's disease, its causes, symptoms, and treatments.",
          url: "/resources/parkinsons-overview",
          imageUrl: "https://placehold.co/600x400?text=Parkinson's+Disease"
        },
        {
          id: "early-signs",
          title: "Early Signs and Symptoms",
          description: "Recognizing the early warning signs of Parkinson's disease.",
          url: "/resources/early-signs",
          imageUrl: "https://placehold.co/600x400?text=Early+Signs"
        },
        {
          id: "treatment-options",
          title: "Treatment Options",
          description: "Current treatments and therapies for managing Parkinson's disease.",
          url: "/resources/treatments",
          imageUrl: "https://placehold.co/600x400?text=Treatment+Options"
        },
        {
          id: "research-advances",
          title: "Research and Advances",
          description: "Latest research and advances in Parkinson's disease.",
          url: "/resources/research-advances",
          imageUrl: "https://placehold.co/600x400?text=Research+Advances"
        }
      ];
    } catch (error) {
      console.error("Failed to get educational resources:", error);
      toast.error("Failed to load educational resources.");
      return [];
    }
  }
};
