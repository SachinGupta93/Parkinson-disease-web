/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserContext } from '@/App';
import { MultiModelPredictionResponse, ModelPrediction } from '@/services/api';

interface ModelResult {
  modelName: string;
  riskScore: number;
  probability: number;
  confidence: number;
}

interface ModelComparisonChartProps {
  modelResults?: ModelResult[];
  multiModelResults?: MultiModelPredictionResponse;
}

const MODEL_COLORS = [
  '#6366f1', // Indigo
  '#7c3aed', // Violet
  '#3b82f6', // Blue
  '#a21caf', // Purple
  '#818cf8', // Light Indigo
  '#c026d3', // Fuchsia
  '#2563eb', // Deep Blue
  '#a78bfa', // Light Purple
];

const DUMMY_MODEL_RESULTS: ModelResult[] = [
  { modelName: 'ensemble', riskScore: 78, probability: 0.82, confidence: 0.89 },
  { modelName: 'xgboost', riskScore: 82, probability: 0.85, confidence: 0.80 },
  { modelName: 'randomForest', riskScore: 76, probability: 0.79, confidence: 0.83 },
  { modelName: 'neuralNetwork', riskScore: 74, probability: 0.77, confidence: 0.78 },
];

const formatModelName = (name: string): string => {
  switch (name) {
    case 'xgboost': return 'XGBoost';
    case 'randomForest': return 'Random Forest';
    case 'random_forest': return 'Random Forest';
    case 'neuralNetwork': return 'Neural Network';
    case 'neural_network': return 'Neural Network';
    case 'svm': return 'SVM';
    case 'gradient_boosting': return 'Gradient Boosting';
    case 'adaboost': return 'AdaBoost';
    case 'extra_trees': return 'Extra Trees';
    case 'ensemble': return 'Ensemble';
    default: return name.charAt(0).toUpperCase() + name.slice(1);
  }
};

const ModelComparisonChart: React.FC<ModelComparisonChartProps> = ({ modelResults, multiModelResults }) => {
  const [chartType, setChartType] = useState<'bar' | 'radar' | 'line' | 'pie'>('bar');
  const [dataType, setDataType] = useState<'all' | 'riskScore' | 'probability' | 'confidence'>('all');
  const { theme } = React.useContext(UserContext);
  const isDarkMode = theme === 'dark';
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [hasValidData, setHasValidData] = useState(false);
  
  // Only log props in development mode if there's an issue
  if (process.env.NODE_ENV === 'development' && !modelResults && !multiModelResults) {
    console.log("ModelComparisonChart - Warning: No model data provided", { modelResults, multiModelResults });
  }

  // Initialize with dummy data
  useEffect(() => {
    // Always start with dummy data
    const dummyData = DUMMY_MODEL_RESULTS.map((result, index) => ({
      model: formatModelName(result.modelName),
      riskScore: result.riskScore,
      probability: Math.round(result.probability * 100),
      confidence: Math.round(result.confidence * 100),
      color: MODEL_COLORS[index % MODEL_COLORS.length],
    }));
    setProcessedData(dummyData);
    setHasValidData(false); // Mark as dummy data
  }, []);

  // Process the data when props change
  useEffect(() => {
    // If no data is provided, keep using the dummy data
    if (!modelResults && !multiModelResults) {
      return;
    }
    
    let sourceData: ModelResult[] = [];

    // First priority: use modelResults if provided
    if (modelResults && modelResults.length > 0) {
      sourceData = modelResults.map(result => {
        return {
          modelName: result.modelName || 'unknown',
          riskScore: typeof result.riskScore === 'number' ? result.riskScore : 0,
          probability: typeof result.probability === 'number' ? result.probability : 0,
          confidence: typeof result.confidence === 'number' ? result.confidence : 0
        };
      });
    }
    // Second priority: process multiModelResults if provided and no modelResults
    else if (multiModelResults) {
      
      // Check if we have a nested models object
      if (multiModelResults.models && Object.keys(multiModelResults.models).length > 0) {
        // Convert the nested models structure to ModelResult format
        const modelEntries = Object.entries(multiModelResults.models);
        
        sourceData = modelEntries
          .filter(([_, modelData]) => modelData !== null) // Filter out null models
          .map(([modelName, modelData]) => {
            if (!modelData) return null;
            
            // Ensure we have valid numeric values
            const probability = typeof modelData.probability === 'number' ? modelData.probability : 0;
            const riskScore = typeof modelData.risk_score === 'number' ? modelData.risk_score : Math.round(probability * 100);
            const confidence = typeof modelData.confidence === 'number' ? modelData.confidence : (probability > 0.5 ? probability : 1 - probability);
            
            return {
              modelName,
              riskScore,
              probability,
              confidence
            };
          })
          .filter(Boolean) as ModelResult[];
      } else {
        // Handle direct model properties at root level
        const modelEntries = Object.entries(multiModelResults)
          .filter(([key, value]) =>
            // Filter out non-model properties and null values
            typeof value === 'object' &&
            value !== null &&
            !['models', 'model_details', 'feature_importance', 'summary', 'timestamp', 'features_used', 'loaded_models', 'chart_data'].includes(key)
          );
        
        sourceData = modelEntries
          .map(([modelName, modelData]) => {
            if (!modelData) return null;

            // Ensure we have valid numeric values
            const probability = typeof modelData.probability === 'number' ? modelData.probability : 0;
            const riskScore = typeof modelData.risk_score === 'number' ? modelData.risk_score : Math.round(probability * 100);
            const confidence = typeof modelData.confidence === 'number' ? modelData.confidence : (probability > 0.5 ? probability : 1 - probability);

            return {
              modelName,
              riskScore,
              probability,
              confidence
            };
          })
          .filter(Boolean) as ModelResult[];
      }
    }
    // Use dummy data if nothing else is available
    else {
      sourceData = DUMMY_MODEL_RESULTS;
    }

    // Transform the source data into chart-ready format
    if (sourceData.length === 0) {
      sourceData = DUMMY_MODEL_RESULTS;
    }
    
    const chartData = sourceData.map((result, index) => {
      const formattedModel = formatModelName(result.modelName);
      const riskScoreValue = typeof result.riskScore === 'number' ? result.riskScore : 0;
      const probabilityValue = typeof result.probability === 'number' ? Math.round(result.probability * 100) : 0;
      const confidenceValue = typeof result.confidence === 'number' ? Math.round(result.confidence * 100) : 0;
      
      return {
        model: formattedModel,
        riskScore: riskScoreValue,
        probability: probabilityValue,
        confidence: confidenceValue,
        color: MODEL_COLORS[index % MODEL_COLORS.length],
      };
    });

    // Check if we have any valid data points - allow 0 values as they might be valid
    const hasData = chartData.some(item =>
      (typeof item.riskScore === 'number' && !isNaN(item.riskScore)) ||
      (typeof item.probability === 'number' && !isNaN(item.probability)) ||
      (typeof item.confidence === 'number' && !isNaN(item.confidence))
    );

    setHasValidData(hasData);
    
    if (chartData.length > 0) {
      setProcessedData(chartData);
    } else {
      // If no data, use dummy data
      const dummyData = DUMMY_MODEL_RESULTS.map((result, index) => ({
        model: formatModelName(result.modelName),
        riskScore: result.riskScore,
        probability: Math.round(result.probability * 100),
        confidence: Math.round(result.confidence * 100),
        color: MODEL_COLORS[index % MODEL_COLORS.length],
      }));
      setProcessedData(dummyData);
    }
  }, [modelResults, multiModelResults]);

  // Filter the data based on the selected data type
  const filteredChartData = dataType === 'all'
    ? processedData
    : processedData.map(item => ({
      model: item.model,
      [dataType]: item[dataType as keyof Omit<typeof item, 'model' | 'color'>],
      color: item.color
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-border p-3 rounded-md shadow-lg backdrop-blur-sm">
          <p className="font-semibold text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => {
            // Safely format the value
            const value = entry.value;
            const formattedValue = typeof value === 'number'
              ? value.toFixed(2)
              : typeof value === 'string' && !isNaN(parseFloat(value))
                ? parseFloat(value).toFixed(2)
                : value;

            return (
              <p key={`item-${index}`} className="text-xs" style={{ color: entry.color || entry.payload?.fill || (isDarkMode ? '#F3F4F6' : '#374151') }}>
                {entry.name}: <span className="font-mono font-medium">{formattedValue}</span>
                {(entry.name?.includes("Probability") || entry.name?.includes("Confidence")) && "%"}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full">
      <CardHeader className="p-3 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Model Comparison Visualization
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Interactive visualization of model predictions
        </p>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-950 p-3 rounded-lg border shadow-sm">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1">Data Source</h4>
                <p className="text-xs text-muted-foreground">
                  {hasValidData 
                    ? "Showing real prediction data from models"
                    : "Showing sample data - submit voice or clinical data for real predictions"}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <Tabs 
              defaultValue="bar" 
              value={chartType}
              onValueChange={(value) => setChartType(value as any)}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="bar" className="text-xs">Bar</TabsTrigger>
                <TabsTrigger value="radar" className="text-xs">Radar</TabsTrigger>
                <TabsTrigger value="line" className="text-xs">Line</TabsTrigger>
                <TabsTrigger value="pie" className="text-xs">Pie</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Select 
              value={dataType} 
              onValueChange={(value) => setDataType(value as any)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select data type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Metrics</SelectItem>
                <SelectItem value="riskScore">Risk Score</SelectItem>
                <SelectItem value="probability">Probability</SelectItem>
                <SelectItem value="confidence">Confidence</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="h-[300px] w-full">
            {chartType === 'bar' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="model" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {dataType === 'all' ? (
                    <>
                      <Bar dataKey="riskScore" name="Risk Score" fill="#6366f1" />
                      <Bar dataKey="probability" name="Probability %" fill="#3b82f6" />
                      <Bar dataKey="confidence" name="Confidence %" fill="#a21caf" />
                    </>
                  ) : (
                    <Bar 
                      dataKey={dataType} 
                      name={dataType === 'riskScore' ? 'Risk Score' : dataType === 'probability' ? 'Probability %' : 'Confidence %'} 
                      fill={dataType === 'riskScore' ? '#6366f1' : dataType === 'probability' ? '#3b82f6' : '#a21caf'}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            )}
            
            {chartType === 'radar' && (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={filteredChartData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="model" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {dataType === 'all' ? (
                    <>
                      <Radar name="Risk Score" dataKey="riskScore" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                      <Radar name="Probability %" dataKey="probability" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      <Radar name="Confidence %" dataKey="confidence" stroke="#a21caf" fill="#a21caf" fillOpacity={0.6} />
                    </>
                  ) : (
                    <Radar 
                      name={dataType === 'riskScore' ? 'Risk Score' : dataType === 'probability' ? 'Probability %' : 'Confidence %'} 
                      dataKey={dataType} 
                      stroke={dataType === 'riskScore' ? '#6366f1' : dataType === 'probability' ? '#3b82f6' : '#a21caf'} 
                      fill={dataType === 'riskScore' ? '#6366f1' : dataType === 'probability' ? '#3b82f6' : '#a21caf'} 
                      fillOpacity={0.6} 
                    />
                  )}
                </RadarChart>
              </ResponsiveContainer>
            )}
            
            {chartType === 'line' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredChartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="model" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {dataType === 'all' ? (
                    <>
                      <Line type="monotone" dataKey="riskScore" name="Risk Score" stroke="#6366f1" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="probability" name="Probability %" stroke="#3b82f6" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="confidence" name="Confidence %" stroke="#a21caf" activeDot={{ r: 8 }} />
                    </>
                  ) : (
                    <Line 
                      type="monotone" 
                      dataKey={dataType} 
                      name={dataType === 'riskScore' ? 'Risk Score' : dataType === 'probability' ? 'Probability %' : 'Confidence %'} 
                      stroke={dataType === 'riskScore' ? '#6366f1' : dataType === 'probability' ? '#3b82f6' : '#a21caf'} 
                      activeDot={{ r: 8 }} 
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
            
            {chartType === 'pie' && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey={dataType === 'all' ? 'riskScore' : dataType}
                    nameKey="model"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {filteredChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelComparisonChart;