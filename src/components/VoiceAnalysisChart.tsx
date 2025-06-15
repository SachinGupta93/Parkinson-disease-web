import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  Mic, Volume2, Activity, Waves, Info, Speaker, BarChart3, 
  PieChart, Radio, AlertCircle, CheckCircle, HeartPulse
} from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VoiceFeature {
  name: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  unit: string;
}

interface VoiceAnalysisChartProps {
  voiceFeatures: Partial<{
    mdvpFo: number;
    mdvpFhi: number;
    mdvpFlo: number;
    mdvpJitter: number;
    mdvpShimmer: number;
    nhr: number;
    hnr: number;
    rpde: number;
    dfa: number;
    spread1: number;
    spread2: number;
    d2: number;
    ppe: number;
  }>;
}

interface ChartDataPoint {
  name: string;
  value: number;
  category: string;
}

interface VoiceMetric {
  name: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  unit: string;
  info?: string;
}

interface VoiceFeatureProps {
  name: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  unit: string;
  info?: string;
}

// Place this before the VoiceAnalysisChart component
const MetricCard: React.FC<VoiceMetric> = ({ name, value, icon, description, unit, info }) => {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{name}</span>
        </div>
        {info && (
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-gray-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{info}</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="text-2xl font-bold mb-1">
        {value.toFixed(2)}{unit}
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
};

export const VoiceAnalysisChart: React.FC<VoiceAnalysisChartProps> = ({ voiceFeatures }) => {  const formatFeatures = (): VoiceMetric[] => {
    // Ensure all values are valid numbers; use fallback if needed
    const ensureValidNumber = (value: number, fallback: number = 1): number => {
      return (value === null || value === undefined || isNaN(value)) ? fallback : value;
    };
    
    const features: VoiceMetric[] = [
      {
        name: 'Average Frequency',
        value: ensureValidNumber(voiceFeatures.mdvpFo, 150),
        icon: <Volume2 className="h-4 w-4 text-blue-600" />,
        description: 'The average fundamental frequency of your voice',
        unit: ' Hz',
        info: 'Higher values may indicate tension in vocal cords. Normal range is typically 120-210 Hz.'
      },
      {
        name: 'Voice Stability',
        value: ensureValidNumber(voiceFeatures.mdvpJitter * 100, 0.6),
        icon: <Activity className="h-4 w-4 text-green-600" />,
        description: 'Measures the variation in voice frequency',
        unit: '%',
        info: 'Lower values indicate more stable voice production. Values below 1.0% are typically considered normal.'
      },
      {
        name: 'Voice Quality',
        value: ensureValidNumber(voiceFeatures.hnr, 20),
        icon: <Speaker className="h-4 w-4 text-amber-600" />,
        description: 'Harmonics-to-Noise Ratio indicates voice clarity',
        unit: ' dB',
        info: 'Higher values indicate clearer voice with less noise. Values above 20 dB typically indicate healthy voice quality.'
      },
      {
        name: 'Voice Pattern',
        value: ensureValidNumber(voiceFeatures.rpde, 0.5),
        icon: <Radio className="h-4 w-4 text-purple-600" />,
        description: 'Measures the regularity of voice patterns',
        unit: '',
        info: 'Values closer to 0 indicate more regular voice patterns, which is typical of healthy voice production.'
      },
      {
        name: 'Voice Strength',
        value: ensureValidNumber(voiceFeatures.mdvpShimmer * 100, 3.8),
        icon: <Mic className="h-4 w-4 text-red-600" />,
        description: 'Measures the variation in voice amplitude',
        unit: '%',
        info: 'Lower values indicate more consistent voice strength. Values below 3.8% are typically considered normal.'
      },
      {
        name: 'Frequency Variation',
        value: ensureValidNumber(Math.abs(voiceFeatures.spread1)),
        icon: <HeartPulse className="h-4 w-4 text-indigo-600" />,
        description: 'Measures vocal frequency distribution',
        unit: '',
        info: 'This nonlinear measure reflects vocal cord function. Abnormal values may indicate vocal irregularities.'
      }
    ];

    return features;
  };
  // Ensure all values are valid numbers to prevent UI errors
  const ensureValidNumber = (value: number, fallback: number = 1): number => {
    return (value === null || value === undefined || isNaN(value) || value === 0) ? fallback : value;
  };

  // Format features for display
  const features = formatFeatures();
  
  // Prepare data for the frequency chart
  const frequencyChartData = [
    { name: 'Min', value: ensureValidNumber(voiceFeatures.mdvpFlo, 110) },
    { name: 'Avg', value: ensureValidNumber(voiceFeatures.mdvpFo, 150) },
    { name: 'Max', value: ensureValidNumber(voiceFeatures.mdvpFhi, 200) }
  ];

  // Prepare data for the voice stability chart
  const stabilityChartData = [
    { name: 'Jitter', value: ensureValidNumber(voiceFeatures.mdvpJitter * 100, 0.6), fill: '#3b82f6' },
    { name: 'Shimmer', value: ensureValidNumber(voiceFeatures.mdvpShimmer * 100, 3.8), fill: '#ef4444' },
    { name: 'NHR', value: ensureValidNumber(voiceFeatures.nhr * 100, 1.5), fill: '#10b981' },
    { name: 'PPE', value: ensureValidNumber(voiceFeatures.ppe * 100, 20), fill: '#8b5cf6' }
  ];

  // Prepare data for the radar chart
  const radarChartData = [
    {
      subject: 'Frequency',
      value: Math.min(Math.max(ensureValidNumber(voiceFeatures.mdvpFo) / 200, 0), 1),
      fullMark: 1
    },
    {
      subject: 'Stability',
      value: Math.min(Math.max(1 - ensureValidNumber(voiceFeatures.mdvpJitter * 10), 0), 1),
      fullMark: 1
    },
    {
      subject: 'Quality',
      value: Math.min(Math.max(ensureValidNumber(voiceFeatures.hnr) / 30, 0), 1),
      fullMark: 1
    },
    {
      subject: 'Pattern',
      value: Math.min(Math.max(1 - ensureValidNumber(voiceFeatures.rpde), 0), 1),
      fullMark: 1
    },
    {
      subject: 'Volume',
      value: Math.min(Math.max(1 - ensureValidNumber(voiceFeatures.mdvpShimmer * 10), 0), 1),
      fullMark: 1
    }
  ];

  const [activeTab, setActiveTab] = useState("frequency");

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice Analysis Results
        </CardTitle>
        <CardDescription>
          Detailed metrics of your voice recording used for parkinson's assessment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Voice Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {features.map((feature, index) => (
              <MetricCard
                key={index}
                name={feature.name}
                value={feature.value}
                icon={feature.icon}
                description={feature.description}
                unit={feature.unit}
                info={feature.info}
              />
            ))}
          </div>
          
          {/* Voice Analysis Charts */}
          <Tabs defaultValue="frequency" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full mb-4">
              <TabsTrigger value="frequency" className="flex items-center gap-2">
                <Waves className="h-4 w-4" />
                <span className="hidden md:inline">Frequency Range</span>
                <span className="inline md:hidden">Frequency</span>
              </TabsTrigger>
              <TabsTrigger value="stability" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="hidden md:inline">Voice Stability</span>
                <span className="inline md:hidden">Stability</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <Radio className="h-4 w-4" />
                <span>Voice Profile</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Frequency Range Chart Tab */}
            <TabsContent value="frequency">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-lg flex items-center gap-2">
                      <Waves className="h-5 w-5 text-blue-600" />
                      Voice Frequency Range
                    </h3>
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger>
                          <Info className="h-5 w-5 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-[250px] text-sm">
                            Shows your voice frequency range from lowest to highest.
                            Typical range for healthy individuals is around 120-210 Hz.
                            Unusual ranges may indicate vocal issues.
                          </p>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={frequencyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: '#6b7280' }}
                          axisLine={{ stroke: '#9ca3af' }}
                        />
                      <YAxis 
                        tick={{ fill: '#6b7280' }}
                        axisLine={{ stroke: '#9ca3af' }}
                        label={{ 
                          value: 'Frequency (Hz)', 
                          angle: -90, 
                          position: 'insideLeft',
                          fill: '#6b7280'
                        }}
                      />                      <Tooltip 
                        wrapperStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Legend />
                      <Line
                        name="Voice Frequency"
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ strokeWidth: 2, r: 6, fill: 'white' }}
                        activeDot={{ r: 8, stroke: '#1e40af' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Voice Stability Chart */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Voice Stability Metrics
                  </h3>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger>
                        <Info className="h-5 w-5 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-[200px] text-sm">
                          Key metrics showing the stability of your voice.
                          Higher values in Jitter and Shimmer may indicate voice tremor.
                        </p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </div>           
                   <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stabilityChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis
                      label={{ 
                        value: 'Value (%)', 
                        angle: -90, 
                        position: 'insideLeft',
                        fill: '#6b7280'
                      }}
                    />
                    <Tooltip
                      formatter={(value) => {
                        // Check if value is a number before using toFixed
                        const formattedValue = typeof value === 'number' 
                          ? `${value.toFixed(2)}%` 
                          : `${value}%`;
                        return [formattedValue, 'Value'];
                      }}
                      wrapperStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="value" name="Percentage" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="stability">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-green-600" />
                      Voice Stability Analysis
                    </h3>
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger>
                          <Info className="h-5 w-5 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-[250px] text-sm">
                            Detailed analysis of voice stability parameters.
                            Lower values in Jitter and Shimmer typically indicate a healthier voice.
                          </p>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Activity className="h-4 w-4 text-blue-600" />
                          Jitter (Frequency Variation)
                        </span>
                        <span className="text-sm font-medium">{(ensureValidNumber(voiceFeatures.mdvpJitter, 0.006) * 100).toFixed(2)}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(ensureValidNumber(voiceFeatures.mdvpJitter, 0.006) * 1000, 100)}%`,
                            background: 'linear-gradient(90deg, #60a5fa, #2563eb)'
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Normal range: 0.3-0.8%. Higher values may indicate vocal tremor.</p>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Mic className="h-4 w-4 text-red-600" />
                          Shimmer (Amplitude Variation)
                        </span>
                        <span className="text-sm font-medium">{(ensureValidNumber(voiceFeatures.mdvpShimmer, 0.038) * 100).toFixed(2)}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(ensureValidNumber(voiceFeatures.mdvpShimmer, 0.038) * 500, 100)}%`,                            background: 'linear-gradient(90deg, #f87171, #ef4444)'
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Normal range: 1.7-4.0%. Higher values may indicate voice disorder.</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Speaker className="h-4 w-4 text-amber-600" />
                          NHR (Noise-to-Harmonics Ratio)
                        </span>
                        <span className="text-sm font-medium">{(ensureValidNumber(voiceFeatures.nhr, 0.015) * 100).toFixed(2)}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(ensureValidNumber(voiceFeatures.nhr, 0.015) * 800, 100)}%`,
                            background: 'linear-gradient(90deg, #fcd34d, #f59e0b)'
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Normal range: 0.8-1.7%. Lower values indicate better vocal quality.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="profile">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-lg flex items-center gap-2">
                      <Radio className="h-5 w-5 text-purple-600" />
                      Voice Profile Analysis
                    </h3>
                    <TooltipProvider>
                      <UITooltip>
                        <TooltipTrigger>
                          <Info className="h-5 w-5 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-[250px] text-sm">
                            Comprehensive voice profile showing all measured parameters.
                            The closer to the outer edge, the better the score.
                          </p>
                        </TooltipContent>
                      </UITooltip>
                    </TooltipProvider>
                  </div>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 1]} />
                        <Radar
                          name="Voice Profile"
                          dataKey="value"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                        <Tooltip />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
export default VoiceAnalysisChart;          
