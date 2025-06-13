import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PredictionResult, ModelType } from "@/utils/parkinsonPredictor";
import { MultiModelPredictionResponse, ModelPrediction } from "@/services/api";

interface ModelComparisonProps {
  modelResults?: PredictionResult[];
  multiModelResults?: MultiModelPredictionResponse;
}

const ModelComparison: React.FC<ModelComparisonProps> = ({ modelResults, multiModelResults }) => {
  // Get color based on risk score or probability
  const getRiskColor = (score: number): string => {
    if (score < 30) return "bg-green-500";
    if (score < 50) return "bg-yellow-500";
    if (score < 70) return "bg-orange-500";
    return "bg-red-500";
  };
  
  // Format model name for display
  const formatModelName = (modelType: string): string => {
    switch(modelType) {
      case 'xgboost': return 'XGBoost';
      case 'random_forest': return 'Random Forest';
      case 'randomForest': return 'Random Forest';
      case 'neural_network': return 'Neural Network';
      case 'neuralNetwork': return 'Neural Network';
      case 'svm': return 'SVM';
      case 'gradient_boosting': return 'Gradient Boosting';
      case 'adaboost': return 'AdaBoost';
      case 'extra_trees': return 'Extra Trees';
      case 'ensemble': return 'Ensemble';
      case 'ensemble_voting_classifier': return 'Ensemble';
      default: return modelType.charAt(0).toUpperCase() + modelType.slice(1).replace('_', ' ');
    }
  };

  // Determine which data source to use
  const renderMultiModelResults = () => {
    if (!multiModelResults) return null;
    
    const modelNames = multiModelResults.loaded_models || [];
    
    return (
      <tbody className="divide-y">
        {modelNames.map((modelName) => {
          const modelData = multiModelResults[modelName as keyof MultiModelPredictionResponse] as ModelPrediction | undefined;
          if (!modelData) return null;
          
          const probability = modelData.probability;
          const riskScore = Math.round(probability * 100);
          const prediction = modelData.prediction;
          
          return (
            <tr key={modelName}>
              <td className="py-2 font-medium">{formatModelName(modelName)}</td>
              <td className="py-2 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span>{riskScore}</span>
                  <div 
                    className={`h-3 w-3 rounded-full ${getRiskColor(riskScore)}`}
                  />
                </div>
              </td>
              <td className="py-2 text-center">
                {(probability * 100).toFixed(1)}%
              </td>
              <td className="py-2 text-center">
                {(0.8 * 100).toFixed(0)}%
              </td>
              <td className="py-2 text-center">
                {prediction === 1 ? 
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">High Risk</span> : 
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Low Risk</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    );
  };

  const renderModelResults = () => {
    if (!modelResults || modelResults.length === 0) return null;
    
    return (
      <tbody className="divide-y">
        {modelResults.map((result) => (
          <tr key={result.modelUsed}>
            <td className="py-2 font-medium">{formatModelName(result.modelUsed)}</td>
            <td className="py-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <span>{result.riskScore}</span>
                <div 
                  className={`h-3 w-3 rounded-full ${getRiskColor(result.riskScore)}`}
                />
              </div>
            </td>
            <td className="py-2 text-center">
              {(result.probability * 100).toFixed(1)}%
            </td>
            <td className="py-2 text-center">
              {(result.confidence * 100).toFixed(0)}%
            </td>
            <td className="py-2 text-center">
              {result.status === 1 ? 
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">High Risk</span> : 
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Low Risk</span>}
            </td>
          </tr>
        ))}
      </tbody>
    );
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Model Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-2">Model</th>
                <th className="text-center pb-2">Risk Score</th>
                <th className="text-center pb-2">Probability</th>
                <th className="text-center pb-2">Confidence</th>
                <th className="text-center pb-2">Status</th>
              </tr>
            </thead>
            {multiModelResults ? renderMultiModelResults() : renderModelResults()}
          </table>
          
          <div className="text-xs text-muted-foreground">
            <p className="mt-2">
              Different models analyze features differently. Ensemble combines all models
              for a more robust prediction.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelComparison;