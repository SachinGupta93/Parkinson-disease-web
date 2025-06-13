// Enhanced Mock FastAPI service for Parkinson's disease prediction
// This simulates a backend API service that would normally be implemented in Python

import { ParkinsonsFeatures, PredictionResult, predictParkinsonRisk } from './parkinsonPredictor';

// The actual implementation of the enhanced mock API
class EnhancedMockFastApi {
  // Simulate API call to get prediction from all models
  async getPrediction(features: ParkinsonsFeatures): Promise<{
    riskScore: number;
    probability: number;
    status: number;
    confidence: number;
    featureImportance: Record<string, number>;
    allModelResults: PredictionResult[];
  }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {      // Get predictions from all models
      const gradientBoostingResult = predictParkinsonRisk(features, 'gradient_boosting');
      const randomForestResult = predictParkinsonRisk(features, 'randomForest');
      const neuralNetworkResult = predictParkinsonRisk(features, 'neuralNetwork');
      const svmResult = predictParkinsonRisk(features, 'svm');
      const adaboostResult = predictParkinsonRisk(features, 'adaboost');
      const extraTreesResult = predictParkinsonRisk(features, 'extra_trees');
      const xgboostResult = predictParkinsonRisk(features, 'xgboost');
      
      // Collect all model results
      const allModelResults = [
        gradientBoostingResult,
        randomForestResult,
        neuralNetworkResult,
        svmResult,
        adaboostResult,
        extraTreesResult,
        xgboostResult
      ];
      
      // Calculate ensemble prediction (average of all models)
      const totalRiskScore = allModelResults.reduce((sum, result) => sum + result.riskScore, 0);
      const totalProbability = allModelResults.reduce((sum, result) => sum + result.probability, 0);
      const totalConfidence = allModelResults.reduce((sum, result) => sum + result.confidence, 0);
      
      const averageRiskScore = Math.round(totalRiskScore / allModelResults.length);
      const averageProbability = totalProbability / allModelResults.length;
      const averageConfidence = totalConfidence / allModelResults.length;
      
      // Determine status based on average risk score
      const status = averageRiskScore > 50 ? 1 : 0;
      
      // Combine feature importance from all models
      const combinedFeatureImportance: Record<string, number> = {};
      
      allModelResults.forEach(result => {
        if (result.featureImportance) {
          Object.entries(result.featureImportance).forEach(([feature, importance]) => {
            if (combinedFeatureImportance[feature]) {
              combinedFeatureImportance[feature] += importance;
            } else {
              combinedFeatureImportance[feature] = importance;
            }
          });
        }
      });
      
      // Normalize feature importance
      Object.keys(combinedFeatureImportance).forEach(feature => {
        combinedFeatureImportance[feature] = parseFloat((combinedFeatureImportance[feature] / allModelResults.length).toFixed(2));
      });
      
      return {
        riskScore: averageRiskScore,
        probability: averageProbability,
        status,
        confidence: averageConfidence,
        featureImportance: combinedFeatureImportance,
        allModelResults
      };
    } catch (error) {
      console.error("Error in prediction:", error);
      throw new Error("Failed to get prediction");
    }
  }
}

// Create an instance and export it
export const enhancedMockFastApi = new EnhancedMockFastApi();