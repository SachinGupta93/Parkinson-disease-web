/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
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
  switch(name) {
    case 'xgboost': return 'XGBoost';
    case 'randomForest': return 'Random Forest';
    case 'neuralNetwork': return 'Neural Network';
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

  let sourceData: ModelResult[] = [];
  
  console.log('ModelComparisonChart - Input props:', { modelResults, multiModelResults });

  // Process multiModelResults if provided
  if (multiModelResults && multiModelResults.chart_data) {
    console.log('ModelComparisonChart - Using multiModelResults');
    // Convert the MultiModelPredictionResponse to ModelResult format
    const modelNames = multiModelResults.loaded_models || [];
    sourceData = modelNames.map((modelName, index) => {
      const modelData = multiModelResults[modelName as keyof MultiModelPredictionResponse] as ModelPrediction | undefined;
      
      if (!modelData) return null;
      
      // Calculate risk score based on probability (0-100 scale)
      const riskScore = Math.round(modelData.probability * 100);
      
      return {
        modelName,
        riskScore,
        probability: modelData.probability,
        confidence: 0.8 // Default confidence if not available
      };
    }).filter(Boolean) as ModelResult[];
    console.log('ModelComparisonChart - Processed multiModelResults:', sourceData);
  }
  // Fall back to provided modelResults if available
  else if (Array.isArray(modelResults) && modelResults.length > 0) {
    console.log('ModelComparisonChart - Using modelResults');
    const validItems = modelResults.filter(item => 
      typeof item === 'object' && item !== null &&
      typeof item.modelName === 'string' &&
      (typeof item.riskScore === 'number' && !isNaN(item.riskScore)) &&
      (typeof item.probability === 'number' && !isNaN(item.probability)) &&
      (typeof item.confidence === 'number' && !isNaN(item.confidence))
    );
    if (validItems.length > 0) {
      sourceData = validItems;
      console.log('ModelComparisonChart - Valid modelResults:', sourceData);
    } else {
      console.log('ModelComparisonChart - No valid items in modelResults');
    }
  }
  // Use dummy data if nothing else is available
  else {
    console.log('ModelComparisonChart - Using dummy data');
    sourceData = DUMMY_MODEL_RESULTS;
  }
    
  const chartData = sourceData.map((result, index) => ({
    model: formatModelName(result.modelName),
    riskScore: result.riskScore,
    probability: Math.round(result.probability * 100),
    confidence: Math.round(result.confidence * 100),
    color: MODEL_COLORS[index % MODEL_COLORS.length],
  }));
  
  console.log('ModelComparisonChart - Formatted chart data:', chartData);
  
  const filteredChartData = dataType === 'all' 
    ? chartData 
    : chartData.map(item => ({
        model: item.model, 
        [dataType]: item[dataType as keyof Omit<typeof item, 'model' | 'color'>],
        color: item.color
      }));
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-border p-3 rounded-md shadow-lg backdrop-blur-sm">
          <p className="font-semibold text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-xs" style={{ color: entry.color || entry.payload?.fill || (isDarkMode ? '#F3F4F6' : '#374151') }}>
              {entry.name}: <span className="font-mono font-medium">{entry.value}</span>
              {(entry.name?.includes("Probability") || entry.name?.includes("Confidence")) && "%"}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col space-y-3 p-1">
      <div className="flex flex-col space-y-2">
        <div className="text-sm text-muted-foreground">
          <h3 className="text-base font-medium text-foreground mb-1">Model Comparison Chart</h3>
          <p className="mb-1"><span className="font-semibold">Purpose:</span> This chart compares how different machine learning models evaluate your Parkinson's risk based on the same input data.</p>
          <p className="mb-1"><span className="font-semibold">What it shows:</span> Each model's risk assessment is displayed with three key metrics:</p>
          <ul className="list-disc list-inside ml-2 mb-1">
            <li><span className="font-semibold">Risk Score (0-100):</span> Overall risk level calculated by the model</li>
            <li><span className="font-semibold">Probability (%):</span> Statistical likelihood of Parkinson's</li>
            <li><span className="font-semibold">Confidence (%):</span> How certain the model is about its prediction</li>
          </ul>
          <p><span className="font-semibold">Technical note:</span> The Ensemble model combines results from multiple algorithms for improved accuracy.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <Tabs value={chartType} onValueChange={(value) => setChartType(value as any)}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-fit gap-1">
            <TabsTrigger value="bar" className="px-2 py-1 text-xs sm:text-sm sm:px-3">Bar</TabsTrigger>
            <TabsTrigger value="radar" className="px-2 py-1 text-xs sm:text-sm sm:px-3">Radar</TabsTrigger>
            <TabsTrigger value="line" className="px-2 py-1 text-xs sm:text-sm sm:px-3">Line</TabsTrigger>
            <TabsTrigger value="pie" className="px-2 py-1 text-xs sm:text-sm sm:px-3">Pie</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="w-full sm:w-[180px]">
          <Select value={dataType} onValueChange={(value) => setDataType(value as any)}>
            <SelectTrigger className="h-9 text-xs sm:text-sm w-full">
              <SelectValue placeholder="Select Metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Metrics</SelectItem>
              <SelectItem value="riskScore">Risk Score</SelectItem>
              <SelectItem value="probability">Probability</SelectItem>
              <SelectItem value="confidence">Confidence</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex-1 min-h-[300px] sm:min-h-[350px] bg-card/80 dark:bg-black/20 rounded-lg p-2 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart 
              data={filteredChartData} 
              margin={{ top: 5, right: 10, left: -10, bottom: 60 }} 
              barGap={dataType === 'all' ? 2 : 4}
              barCategoryGap={dataType === 'all' ? '10%' : '20%'}
              maxBarSize={dataType === 'all' ? 25 : 40}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis 
                dataKey="model" 
                tick={{ fill: isDarkMode ? '#E5E7EB' : '#4B5563', fontSize: 9 }} 
                axisLine={{ stroke: isDarkMode ? '#4B5563' : '#D1D5DB', opacity: 0.5 }} 
                height={60} 
                interval={0}
                angle={-45}
                textAnchor="end"
              />
              <YAxis 
                tick={{ fill: isDarkMode ? '#E5E7EB' : '#4B5563', fontSize: 9 }} 
                axisLine={{ stroke: isDarkMode ? '#4B5563' : '#D1D5DB', opacity: 0.5 }}
                domain={[0, dataType === 'riskScore' ? 100 : (dataType === 'all' ? 'auto' : 100)]}
                allowDataOverflow={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}/>
              <Legend 
                wrapperStyle={{ paddingTop: 10, paddingBottom: 0, fontSize: '10px' }} 
                formatter={(value) => <span style={{ color: isDarkMode ? '#F3F4F6' : '#374151' }} className="text-xs">{value}</span>} 
              />
              {(dataType === 'all' || dataType === 'riskScore') && <Bar dataKey="riskScore" name="Risk Score" fill={MODEL_COLORS[0]} radius={[4, 4, 0, 0]} />}
              {(dataType === 'all' || dataType === 'probability') && <Bar dataKey="probability" name="Probability (%)" fill={MODEL_COLORS[1]} radius={[4, 4, 0, 0]} />}
              {(dataType === 'all' || dataType === 'confidence') && <Bar dataKey="confidence" name="Confidence (%)" fill={MODEL_COLORS[2]} radius={[4, 4, 0, 0]} />}
            </BarChart>
          ) : chartType === 'radar' ? (
            <RadarChart 
              outerRadius="75%" 
              data={chartData} // Radar chart typically shows all metrics for each model
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <PolarGrid stroke="var(--border)" strokeOpacity={0.3} />
              <PolarAngleAxis 
                dataKey="model" 
                tick={{ fill: isDarkMode ? '#E5E7EB' : '#4B5563', fontSize: 10 }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 100]} 
                tick={{ fill: isDarkMode ? '#E5E7EB' : '#4B5563', fontSize: 9 }} 
                axisLine={false}
                tickCount={6}
              />
              <Radar name="Risk Score" dataKey="riskScore" stroke={MODEL_COLORS[0]} fill={MODEL_COLORS[0]} fillOpacity={0.5} />
              <Radar name="Probability (%)" dataKey="probability" stroke={MODEL_COLORS[1]} fill={MODEL_COLORS[1]} fillOpacity={0.5} />
              <Radar name="Confidence (%)" dataKey="confidence" stroke={MODEL_COLORS[2]} fill={MODEL_COLORS[2]} fillOpacity={0.5} />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: '10px' }} formatter={(value) => <span style={{ color: isDarkMode ? '#F3F4F6' : '#374151' }} className="text-xs">{value}</span>} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          ) : chartType === 'line' ? (
            <LineChart data={filteredChartData} margin={{ top: 5, right: 10, left: -10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis 
                dataKey="model" 
                tick={{ fill: isDarkMode ? '#E5E7EB' : '#4B5563', fontSize: 9 }} 
                axisLine={{ stroke: isDarkMode ? '#4B5563' : '#D1D5DB', opacity: 0.5 }}
                angle={-45}
                textAnchor="end"
                height={60} 
                interval={0}
              />
              <YAxis 
                tick={{ fill: isDarkMode ? '#E5E7EB' : '#4B5563', fontSize: 9 }} 
                axisLine={{ stroke: isDarkMode ? '#4B5563' : '#D1D5DB', opacity: 0.5 }} 
                domain={[0, 100]} 
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 1 }}/>
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: '10px' }} formatter={(value) => <span style={{ color: isDarkMode ? '#F3F4F6' : '#374151' }} className="text-xs">{value}</span>} />
              {(dataType === 'all' || dataType === 'riskScore') && <Line type="monotone" dataKey="riskScore" name="Risk Score" stroke={MODEL_COLORS[0]} strokeWidth={2} dot={{ r: 3, fill: MODEL_COLORS[0] }} activeDot={{ r: 6, strokeWidth: 2, stroke: MODEL_COLORS[0] }} />}
              {(dataType === 'all' || dataType === 'probability') && <Line type="monotone" dataKey="probability" name="Probability (%)" stroke={MODEL_COLORS[1]} strokeWidth={2} dot={{ r: 3, fill: MODEL_COLORS[1] }} activeDot={{ r: 6, strokeWidth: 2, stroke: MODEL_COLORS[1] }} />}
              {(dataType === 'all' || dataType === 'confidence') && <Line type="monotone" dataKey="confidence" name="Confidence (%)" stroke={MODEL_COLORS[2]} strokeWidth={2} dot={{ r: 3, fill: MODEL_COLORS[2] }} activeDot={{ r: 6, strokeWidth: 2, stroke: MODEL_COLORS[2] }} />}
            </LineChart>
          ) : chartType === 'pie' ? (
            <PieChart margin={{ top: 10, right: 10, bottom: 40, left: 10 }}>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                wrapperStyle={{ paddingTop: 10, fontSize: '10px' }} 
                formatter={(value) => <span style={{ color: isDarkMode ? '#F3F4F6' : '#374151' }} className="text-xs">{value}</span>} 
              />
              <Pie 
                data={filteredChartData.filter(d => {
                  const keyForPieData = dataType === 'all' ? 'riskScore' : dataType as 'riskScore' | 'probability' | 'confidence';
                  const value = d[keyForPieData];
                  return typeof value === 'number' && value > 0;
                })} 
                dataKey={dataType === 'all' ? 'riskScore' : dataType as 'riskScore' | 'probability' | 'confidence'} 
                nameKey="model" 
                cx="50%" 
                cy="45%" 
                outerRadius="75%"
                innerRadius="30%"
                paddingAngle={1}
                labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, ...rest }: any) => {
                  const keyForPieData = dataType === 'all' ? 'riskScore' : dataType as 'riskScore' | 'probability' | 'confidence';
                  const dataForPieLabel = filteredChartData.filter(d => {
                    const value = d[keyForPieData];
                    return typeof value === 'number' && value > 0;
                  });
                  const entry = dataForPieLabel[index];
                  if (!entry) return null;

                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  
                  return (
                    <text
                      x={x}
                      y={y}
                      fill={isDarkMode ? "#F9FAFB" : "#1F2937"}
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                      fontSize="10px"
                      fontWeight="medium"
                    >
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
              >
                {filteredChartData.filter(d => {
                  const keyForPieData = dataType === 'all' ? 'riskScore' : dataType as 'riskScore' | 'probability' | 'confidence';
                  const value = d[keyForPieData];
                  return typeof value === 'number' && value > 0;
                }).map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color || MODEL_COLORS[idx % MODEL_COLORS.length]} stroke={isDarkMode ? "var(--background)" : "var(--background)"} strokeWidth={1}/>
                ))}
              </Pie>
            </PieChart>
          ) : null}
        </ResponsiveContainer>
      </div>
      
      <div className="text-xs text-muted-foreground bg-card/80 dark:bg-black/20 p-2 rounded-lg shadow-sm">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <div className="flex items-center">
            <div className="w-2.5 h-2.5 rounded-full mr-1" style={{backgroundColor: MODEL_COLORS[0]}}></div>
            <span><span className="font-medium">Risk:</span> 0-100</span>
          </div>
          <div className="flex items-center">
            <div className="w-2.5 h-2.5 rounded-full mr-1" style={{backgroundColor: MODEL_COLORS[1]}}></div>
            <span><span className="font-medium">Prob:</span> 0-100%</span>
          </div>
          <div className="flex items-center">
            <div className="w-2.5 h-2.5 rounded-full mr-1" style={{backgroundColor: MODEL_COLORS[2]}}></div>
            <span><span className="font-medium">Conf:</span> 0-100%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelComparisonChart;
