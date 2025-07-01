import React, { useMemo } from "react";
// Force reload - timestamp: 2024-01-15T10:30:00.000Z
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PredictionResult, ModelType } from "@/types";
import { MultiModelPredictionResponse, ModelPrediction } from "@/services/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserContext } from "@/App";
import ModelComparisonChart from "@/components/ModelComparisonChart";

// Dummy data for when no real data is available
const DUMMY_MODEL_RESULTS = [
  { modelName: 'ensemble', riskScore: 78, probability: 0.82, confidence: 0.89 },
  { modelName: 'xgboost', riskScore: 82, probability: 0.85, confidence: 0.80 },
  { modelName: 'randomForest', riskScore: 76, probability: 0.79, confidence: 0.83 },
  { modelName: 'neuralNetwork', riskScore: 74, probability: 0.77, confidence: 0.78 },
];

interface ModelComparisonProps {
  modelResults?: PredictionResult[];
  multiModelResults?: MultiModelPredictionResponse;
}

const ModelComparison: React.FC<ModelComparisonProps> = ({ modelResults = [], multiModelResults }) => {
  const { theme } = React.useContext(UserContext);
  const isDarkMode = theme === 'dark';

  // Debug logging
  console.log("ModelComparison - Received props:", { modelResults, multiModelResults });
  console.log("ModelComparison - modelResults type:", typeof modelResults, Array.isArray(modelResults));
  
  // Ensure modelResults is an array
  const safeModelResults = Array.isArray(modelResults) ? modelResults : [];
  
  // Early return if no data is available
  if (safeModelResults.length === 0 && !multiModelResults) {
    console.log("ModelComparison - No data available, returning empty state");
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No model comparison data available</p>
      </div>
    );
  }

  // Get color based on risk score or probability
  const getRiskColor = (score: number): string => {
    if (score < 30) return "bg-green-500";
    if (score < 50) return "bg-yellow-500";
    if (score < 70) return "bg-orange-500";
    return "bg-red-500";
  };
  
  // Format model name for display
  const formatModelName = (modelType: any): string => {
    try {
      // Multiple safety checks for undefined/null/invalid modelType
      if (modelType === null || modelType === undefined) {
        console.warn('formatModelName: modelType is null or undefined');
        return 'Unknown Model';
      }
      
      if (typeof modelType !== 'string') {
        console.warn('formatModelName: modelType is not a string:', typeof modelType, modelType);
        return 'Unknown Model';
      }
      
      if (modelType.length === 0) {
        console.warn('formatModelName: modelType is empty string');
        return 'Unknown Model';
      }
      
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
        default: 
          // Additional safety check before charAt
          if (modelType && typeof modelType === 'string' && modelType.length > 0) {
            return modelType.charAt(0).toUpperCase() + modelType.slice(1).replace('_', ' ');
          } else {
            return 'Unknown Model';
          }
      }
    } catch (error) {
      console.error('formatModelName: Unexpected error:', error, 'modelType:', modelType);
      return 'Unknown Model';
    }
  };
  // Determine which data source to use
  const renderMultiModelResults = () => {
    if (!multiModelResults) return null;
    
    // Check if we have a nested models object or direct model properties
    const hasNestedModels = multiModelResults.models && Object.keys(multiModelResults.models || {}).length > 0;
    
    // Get model entries either from nested models object or direct properties
    const modelEntries = hasNestedModels && multiModelResults.models
      ? Object.entries(multiModelResults.models)
      : Object.entries(multiModelResults)
          .filter(([key, value]) => 
            // Filter out non-model properties
            typeof value === 'object' && 
            value !== null && 
            !['models', 'model_details', 'feature_importance', 'summary', 'timestamp', 'features_used', 'loaded_models', 'chart_data'].includes(key)
          );
    
    console.log("Model entries for rendering:", modelEntries);
    
    return (
      <>
        {modelEntries
          .filter(([modelName, modelData]) => {
            if (!modelData) return false;
            
            const modelDataTyped = modelData as ModelPrediction;
            const probability = modelDataTyped.probability !== undefined ? modelDataTyped.probability : 0;
            const prediction = modelDataTyped.prediction !== undefined ? modelDataTyped.prediction : 0;
            
            // Filter out entries with missing essential properties
            if (probability === undefined || prediction === undefined) {
              console.log(`Skipping model ${modelName} due to missing essential properties`, modelData);
              return false;
            }
            
            return true;
          })
          .map(([modelName, modelData]) => {
            // Handle both nested and direct model data structures
            const modelDataTyped = modelData as ModelPrediction;
            
            const probability = modelDataTyped.probability !== undefined ? modelDataTyped.probability : 0;
            // Calculate risk score from probability if not provided
            const riskScore = modelDataTyped.risk_score !== undefined ? 
              modelDataTyped.risk_score : 
              Math.round(probability * 100);
            const prediction = modelDataTyped.prediction !== undefined ? modelDataTyped.prediction : 0;
            // Use a default confidence value if not provided
            const confidence = modelDataTyped.confidence !== undefined ? 
              modelDataTyped.confidence : 
              (probability > 0.5 ? probability : 1 - probability); // Estimate confidence
            
            return (
              <tr key={modelName}>
              <td className="py-2 font-medium">{formatModelName(modelName)}</td>
              <td className="py-2 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span>{Math.round(riskScore)}</span>
                  <div 
                    className={`h-3 w-3 rounded-full ${getRiskColor(riskScore)}`}
                  />
                </div>
              </td>
              <td className="py-2 text-center">
                {(probability * 100).toFixed(1)}%
              </td>
              <td className="py-2 text-center">
                {(confidence * 100).toFixed(0)}%
              </td>
              <td className="py-2 text-center">
                {prediction === 1 ? 
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">High Risk</span> : 
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Low Risk</span>}
              </td>
            </tr>
          );
        })}
      </>
    );
  };

  const renderModelResults = () => {
    if (!modelResults || modelResults.length === 0) return null;
    
    return (
      <>
        {modelResults
          .filter(result => result && result.modelUsed)
          .map((result) => (
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
      </>
    );
  };
  
  // Prepare chart data
  const chartData = useMemo(() => {
    let data = [];
    
    console.log("ModelComparison - multiModelResults:", multiModelResults);
    console.log("ModelComparison - safeModelResults:", safeModelResults);
    
    // Safety check: return empty data if no valid inputs
    if (!multiModelResults && safeModelResults.length === 0) {
      console.log("ModelComparison - No valid data sources, returning empty array");
      return [];
    }
    
    try {
      if (multiModelResults) {
        // Check if we have a nested models object or direct model properties
        const hasNestedModels = multiModelResults.models && Object.keys(multiModelResults.models || {}).length > 0;
      
      console.log("ModelComparison - hasNestedModels:", hasNestedModels);
      
      // Get model entries either from nested models object or direct properties
      const modelEntries = hasNestedModels && multiModelResults.models
        ? Object.entries(multiModelResults.models)
        : Object.entries(multiModelResults)
            .filter(([key, value]) => 
              // Filter out non-model properties
              typeof value === 'object' && 
              value !== null && 
              !['models', 'model_details', 'feature_importance', 'summary', 'timestamp', 'features_used', 'loaded_models', 'chart_data'].includes(key)
            );
      
      console.log("ModelComparison - modelEntries:", modelEntries);
      
      data = modelEntries
        .filter(([modelName, modelData]) => {
          const isValid = modelData !== null && 
                          modelName !== null && 
                          modelName !== undefined && 
                          typeof modelName === 'string' && 
                          modelName.trim().length > 0;
          if (!isValid) {
            console.warn("ModelComparison - Filtering out invalid entry:", { modelName, modelData });
          }
          return isValid;
        })
        .map(([modelName, modelData]) => {
          const modelDataTyped = modelData as ModelPrediction;
          
          const probability = modelDataTyped.probability !== undefined ? modelDataTyped.probability : 0;
          const riskScore = modelDataTyped.risk_score !== undefined ? 
            modelDataTyped.risk_score : 
            Math.round(probability * 100);
          const confidence = modelDataTyped.confidence !== undefined ? 
            modelDataTyped.confidence : 
            (probability > 0.5 ? probability : 1 - probability);
            
          let formattedName;
          try {
            formattedName = formatModelName(modelName);
          } catch (error) {
            console.error("ModelComparison - Error formatting model name:", { modelName, error });
            formattedName = 'Unknown Model';
          }
          
          return {
            name: formattedName,
            riskScore: Math.round(riskScore),
            probability: Math.round(probability * 100),
            confidence: Math.round(confidence * 100)
          };
        });
    } else if (safeModelResults.length > 0) {
      console.log("ModelComparison - using safeModelResults");
      data = safeModelResults
        .filter(result => result && result.modelUsed)
        .map(result => {
          let formattedName;
          try {
            formattedName = formatModelName(result.modelUsed);
          } catch (error) {
            console.error("ModelComparison - Error formatting model name from result:", { modelUsed: result.modelUsed, error });
            formattedName = 'Unknown Model';
          }
          
          return {
            name: formattedName,
            riskScore: result.riskScore || 0,
            probability: Math.round((result.probability || 0) * 100),
            confidence: Math.round((result.confidence || 0) * 100)
          };
        });
    }
    
    // If no data, provide sample data
    if (data.length === 0) {
      data = [
        { name: 'Ensemble', riskScore: 78, probability: 82, confidence: 89 },
        { name: 'XGBoost', riskScore: 82, probability: 85, confidence: 80 },
        { name: 'Random Forest', riskScore: 76, probability: 79, confidence: 83 },
        { name: 'Neural Network', riskScore: 74, probability: 77, confidence: 78 }
      ];
    }
    
    return data;
    } catch (error) {
      console.error("ModelComparison - Error processing data:", error);
      // Return sample data in case of error
      return [
        { name: 'Ensemble', riskScore: 78, probability: 82, confidence: 89 },
        { name: 'XGBoost', riskScore: 82, probability: 85, confidence: 80 },
        { name: 'Random Forest', riskScore: 76, probability: 79, confidence: 83 },
        { name: 'Neural Network', riskScore: 74, probability: 77, confidence: 78 }
      ];
    }
  }, [multiModelResults, safeModelResults]);
  
  return (
    <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30">
        <CardTitle className="text-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          Model Comparison
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare predictions from multiple machine learning models
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 space-y-4">
          <div className="mb-6" style={{ minHeight: "500px" }}>
            {/* Use the ModelComparisonChart component for advanced visualizations */}
            <ModelComparisonChart 
              modelResults={safeModelResults.length > 0 ? safeModelResults.map(result => ({
                modelName: result?.modelUsed || 'unknown',
                riskScore: typeof result?.riskScore === 'number' ? result.riskScore : 0,
                probability: typeof result?.probability === 'number' ? result.probability : 0,
                confidence: typeof result?.confidence === 'number' ? result.confidence : 0
              })) : undefined} 
              multiModelResults={multiModelResults} 
            />
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-2 font-medium">Model</th>
                  <th className="text-center p-2 font-medium">Risk Score</th>
                  <th className="text-center p-2 font-medium">Probability</th>
                  <th className="text-center p-2 font-medium">Confidence</th>
                  <th className="text-center p-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {multiModelResults ? renderMultiModelResults() : renderModelResults()}
              </tbody>
            </table>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-100 dark:border-blue-900/50">
            <div className="flex gap-2 items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">How to interpret these results:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li><span className="font-medium">Risk Score</span>: Overall risk level (0-100)</li>
                  <li><span className="font-medium">Probability</span>: Statistical likelihood of Parkinson's</li>
                  <li><span className="font-medium">Confidence</span>: How certain the model is about its prediction</li>
                  <li><span className="font-medium">Ensemble model</span> combines all models for a more robust prediction</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelComparison;