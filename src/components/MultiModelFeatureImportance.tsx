import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiModelPredictionResponse, ModelPrediction } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MultiModelFeatureImportanceProps {
  multiModelResults: MultiModelPredictionResponse;
}

const MultiModelFeatureImportance: React.FC<MultiModelFeatureImportanceProps> = ({ multiModelResults }) => {
  // Guard against missing data
  if (!multiModelResults) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Feature Importance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No model data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get available models with feature importance
  const getAvailableModels = () => {
    console.log("MultiModelFeatureImportance - multiModelResults:", multiModelResults);
    
    // Check if we have a nested models object or direct model properties
    const hasNestedModels = multiModelResults.models && Object.keys(multiModelResults.models || {}).length > 0;
    console.log("MultiModelFeatureImportance - hasNestedModels:", hasNestedModels);
    
    // First, check if any models have their own feature_importance
    const modelsWithOwnFeatureImportance: string[] = [];
    
    if (hasNestedModels && multiModelResults.models) {
      // Check nested models
      Object.entries(multiModelResults.models).forEach(([modelName, modelData]) => {
        if (modelData && modelData.feature_importance && 
            Object.keys(modelData.feature_importance).length > 0) {
          modelsWithOwnFeatureImportance.push(modelName);
        }
      });
    } else {
      // Check direct model properties
      Object.entries(multiModelResults).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && 
            !['models', 'model_details', 'feature_importance', 'summary', 'timestamp', 'features_used', 'loaded_models', 'chart_data'].includes(key)) {
          const modelData = value as any;
          if (modelData.feature_importance && Object.keys(modelData.feature_importance).length > 0) {
            modelsWithOwnFeatureImportance.push(key);
          }
        }
      });
    }
    
    console.log("MultiModelFeatureImportance - modelsWithOwnFeatureImportance:", modelsWithOwnFeatureImportance);
    
    // If we found models with their own feature importance, return those
    if (modelsWithOwnFeatureImportance.length > 0) {
      return modelsWithOwnFeatureImportance;
    }
    
    // Check if we have global feature importance
    const hasGlobalFeatureImportance = multiModelResults.feature_importance && 
                                      Object.keys(multiModelResults.feature_importance || {}).length > 0;
    
    console.log("MultiModelFeatureImportance - hasGlobalFeatureImportance:", hasGlobalFeatureImportance);
    
    // If we have global feature importance, return all available models
    if (hasGlobalFeatureImportance) {
      if (hasNestedModels && multiModelResults.models) {
        // Return all models from nested structure
        return Object.keys(multiModelResults.models);
      } else {
        // Return model names from direct properties
        return Object.keys(multiModelResults)
          .filter(key => 
            // Filter for model objects
            typeof multiModelResults[key] === 'object' && 
            multiModelResults[key] !== null && 
            !['models', 'model_details', 'feature_importance', 'summary', 'timestamp', 'features_used', 'loaded_models', 'chart_data'].includes(key)
          );
      }
    }
    
    // If no feature importance data is available, return an empty array
    return [];
  };

  const availableModels = getAvailableModels();
  const [selectedModel, setSelectedModel] = useState<string>(availableModels[0] || 'ensemble');

  // Format model name for display
  const formatModelName = (modelType: string): string => {
    switch(modelType) {
      case 'xgboost': return 'XGBoost';
      case 'random_forest': return 'Random Forest';
      case 'neural_network': return 'Neural Network';
      case 'svm': return 'SVM';
      case 'gradient_boosting': return 'Gradient Boosting';
      case 'adaboost': return 'AdaBoost';
      case 'extra_trees': return 'Extra Trees';
      case 'ensemble': return 'Ensemble';
      default: return modelType.charAt(0).toUpperCase() + modelType.slice(1).replace('_', ' ');
    }
  };

  // Format feature name for display
  const formatFeatureName = (featureName: string): string => {
    // Remove common prefixes and format
    return featureName
      .replace('MDVP:', '')
      .replace('Shimmer_', 'Shimmer ')
      .replace('Jitter_', 'Jitter ')
      .replace('(Hz)', '')
      .replace('(%)', '%')
      .replace('(dB)', 'dB');
  };  // Get available models with feature importance
  const modelsWithFeatureImportance = availableModels;
  // Get feature importance data for the selected model
  const getFeatureImportanceData = () => {
    if (!selectedModel) return [];
    
    console.log("MultiModelFeatureImportance - getFeatureImportanceData - selectedModel:", selectedModel);
    
    // First check if the selected model has its own feature importance
    let modelSpecificFeatureImportance: Record<string, number> | null = null;
    const hasNestedModels = multiModelResults.models && Object.keys(multiModelResults.models || {}).length > 0;
    
    try {
      if (hasNestedModels && multiModelResults.models && multiModelResults.models[selectedModel]) {
        const modelData = multiModelResults.models[selectedModel];
        console.log("MultiModelFeatureImportance - Nested model data:", modelData);
        
        if (modelData && modelData.feature_importance) {
          // Get from nested model
          modelSpecificFeatureImportance = modelData.feature_importance;
          console.log("MultiModelFeatureImportance - Found nested model feature importance");
        }
      } else if (!hasNestedModels && multiModelResults[selectedModel]) {
        const modelData = multiModelResults[selectedModel] as any;
        console.log("MultiModelFeatureImportance - Direct model data:", modelData);
        
        if (modelData && modelData.feature_importance) {
          // Get from direct model property
          modelSpecificFeatureImportance = modelData.feature_importance;
          console.log("MultiModelFeatureImportance - Found direct model feature importance");
        }
      }
      
      // Use model-specific feature importance if available, otherwise fall back to global
      const featureImportance = modelSpecificFeatureImportance || multiModelResults.feature_importance || {};
      console.log("MultiModelFeatureImportance - Final feature importance:", featureImportance);
      
      if (Object.keys(featureImportance).length === 0) {
        console.log("MultiModelFeatureImportance - No feature importance data found");
        return [];
      }
      
      // Convert feature importance to array and sort by importance
      const result = Object.entries(featureImportance)
        .map(([feature, importance]) => {
          // Handle both number and string values
          let importanceValue: number;
          
          if (typeof importance === 'number') {
            importanceValue = importance;
          } else if (typeof importance === 'string') {
            importanceValue = parseFloat(importance);
          } else {
            // If it's neither number nor string, skip this entry
            return null;
          }
          
          if (isNaN(importanceValue)) return null;
          
          return {
            feature: formatFeatureName(feature),
            importance: Number(importanceValue.toFixed(4)),
            fullFeatureName: feature
          };
        })
        .filter((item): item is { feature: string; importance: number; fullFeatureName: string } => item !== null) // Remove null entries with type guard
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 10); // Show top 10 features
      
      console.log("MultiModelFeatureImportance - Processed feature importance data:", result);
      return result;
    } catch (error) {
      console.error("Error processing feature importance data:", error);
      return [];
    }
  };

  const featureImportanceData = getFeatureImportanceData();
  const hasFeatureImportance = featureImportanceData.length > 0;

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Safely format the value
      const value = payload[0]?.value;
      const formattedValue = typeof value === 'number' 
        ? value.toFixed(4) 
        : typeof value === 'string' 
          ? parseFloat(value).toFixed(4) 
          : 'N/A';
          
      return (
        <div className="bg-background/95 border border-border p-3 rounded-md shadow-lg backdrop-blur-sm">
          <p className="font-semibold text-sm mb-1">{label}</p>
          <p className="text-xs">
            Importance: <span className="font-mono font-medium">{formattedValue}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
        <CardTitle className="text-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"></path>
            <path d="M18 17V9"></path>
            <path d="M13 17V5"></path>
            <path d="M8 17v-3"></path>
          </svg>
          Feature Importance Analysis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Discover which voice characteristics most strongly influence the prediction
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {modelsWithFeatureImportance.length > 0 ? (
            <>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-full sm:w-[200px]">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Select model to view features:
                  </label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="h-9 text-xs sm:text-sm w-full bg-white dark:bg-gray-950 border-indigo-100 dark:border-indigo-900/50">
                      <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent>
                      {modelsWithFeatureImportance.map(model => (
                        <SelectItem key={model} value={model}>
                          {formatModelName(model)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1 text-xs text-muted-foreground bg-purple-50 dark:bg-purple-950/20 p-2 rounded-md border border-purple-100 dark:border-purple-900/50">
                  <p className="font-medium text-purple-800 dark:text-purple-300 mb-1">What is feature importance?</p>
                  <p>
                    These values show which voice characteristics most strongly influence the model's prediction.
                    Higher values indicate greater importance in the decision-making process.
                  </p>
                </div>
              </div>

              {hasFeatureImportance ? (
                <div className="h-[300px] mt-4 bg-white dark:bg-gray-950 p-4 rounded-lg border">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={featureImportanceData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(0,0,0,0.1)" />
                      <XAxis 
                        type="number" 
                        domain={[0, 'dataMax']} 
                        tickFormatter={(value) => value.toFixed(2)}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis 
                        dataKey="feature" 
                        type="category" 
                        width={120}
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="importance" fill="#8884d8" radius={[0, 4, 4, 0]}>
                        {featureImportanceData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`hsl(${260 - index * 12}, ${80 - index * 3}%, ${50 + index * 2}%)`} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18"></path>
                    <path d="M18 17V9"></path>
                    <path d="M13 17V5"></path>
                    <path d="M8 17v-3"></path>
                  </svg>
                  <p className="text-muted-foreground">No feature importance data available for this model</p>
                  <p className="text-xs text-muted-foreground mt-1">Try selecting a different model</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                {featureImportanceData.slice(0, 3).map((feature, index) => (
                  <div key={index} className="bg-white dark:bg-gray-950 p-3 rounded-md border shadow-sm">
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium text-sm">{feature.feature}</div>
                      <div className="text-xs font-mono bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded">
                        {feature.importance.toFixed(4)}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {index === 0 ? 'Most important feature in the model' : 
                       index === 1 ? 'Second most important feature' : 
                       'Third most important feature'}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/50 rounded-lg border">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8v4"></path>
                <path d="M12 16h.01"></path>
              </svg>
              <p className="text-lg font-medium text-muted-foreground">No feature importance data available</p>
              <p className="text-sm text-muted-foreground mt-1">The models did not provide feature importance information</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiModelFeatureImportance;