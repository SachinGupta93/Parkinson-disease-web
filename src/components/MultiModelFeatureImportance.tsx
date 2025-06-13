import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiModelPredictionResponse, ModelPrediction } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MultiModelFeatureImportanceProps {
  multiModelResults: MultiModelPredictionResponse;
}

const MultiModelFeatureImportance: React.FC<MultiModelFeatureImportanceProps> = ({ multiModelResults }) => {
  const [selectedModel, setSelectedModel] = useState<string>('ensemble');

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
  };

  // Get available models with feature importance
  const modelsWithFeatureImportance = multiModelResults.loaded_models.filter(modelName => {
    const modelData = multiModelResults[modelName as keyof MultiModelPredictionResponse] as ModelPrediction | undefined;
    return modelData && modelData.feature_importance && Object.keys(modelData.feature_importance).length > 0;
  });

  // Get feature importance data for the selected model
  const getFeatureImportanceData = () => {
    if (!selectedModel) return [];
    
    const modelData = multiModelResults[selectedModel as keyof MultiModelPredictionResponse] as ModelPrediction | undefined;
    if (!modelData || !modelData.feature_importance) return [];
    
    // Convert feature importance to array and sort by importance
    return Object.entries(modelData.feature_importance)
      .map(([feature, importance]) => ({
        feature: formatFeatureName(feature),
        importance: Number(importance.toFixed(4)),
        fullFeatureName: feature
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10); // Show top 10 features
  };

  const featureImportanceData = getFeatureImportanceData();
  const hasFeatureImportance = featureImportanceData.length > 0;

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-border p-3 rounded-md shadow-lg backdrop-blur-sm">
          <p className="font-semibold text-sm mb-1">{label}</p>
          <p className="text-xs">
            Importance: <span className="font-mono font-medium">{payload[0].value.toFixed(4)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Feature Importance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {modelsWithFeatureImportance.length > 0 ? (
            <>
              <div className="w-full sm:w-[200px]">
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="h-9 text-xs sm:text-sm w-full">
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

              {hasFeatureImportance ? (
                <div className="h-[300px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={featureImportanceData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" domain={[0, 'dataMax']} />
                      <YAxis 
                        dataKey="feature" 
                        type="category" 
                        width={100}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="importance" fill="#8884d8">
                        {featureImportanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${210 + index * 15}, 70%, 50%)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No feature importance data available for this model
                </div>
              )}

              <div className="text-xs text-muted-foreground mt-2">
                <p>
                  Feature importance shows which voice characteristics most strongly influence the model's prediction.
                  Higher values indicate greater importance in the decision-making process.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No feature importance data available from any model
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiModelFeatureImportance;