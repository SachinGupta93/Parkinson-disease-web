import React, { useState, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserContext } from '@/App';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// Unique color palette for VoiceAnalysisVisualizer (oranges & teals)
const CHART_COLORS = [
  '#f59e42', // Orange
  '#14b8a6', // Teal
  '#fbbf24', // Amber
  '#0ea5e9', // Sky
  '#fb7185', // Rose
  '#f472b6', // Pink
];

// Brighter colors for dark mode
const DARK_CHART_COLORS = [
  '#ff9f43', // Bright Orange
  '#2dd4bf', // Bright Teal
  '#fcd34d', // Bright Amber
  '#38bdf8', // Bright Sky
  '#fb7185', // Bright Rose
  '#f472b6', // Bright Pink
];

// Helper function to normalize voice feature values to a 0-100 scale
function normalizeVoiceFeature(value: number | undefined, min: number, max: number): number {
  if (value === undefined || value === null || isNaN(Number(value))) {
    return 50; // Default to middle value if missing or invalid
  }
  
  // Convert to number to ensure proper calculation
  const numValue = Number(value);
  return Math.min(100, Math.max(0, ((numValue - min) / (max - min)) * 100));
}

type VoiceFeatures = {
  mdvpFo?: number;
  mdvpFhi?: number;
  mdvpFlo?: number;
  mdvpJitter?: number;
  mdvpShimmer?: number;
  nhr?: number;
  hnr?: number;
  rpde?: number;
  dfa?: number;
  spread1?: number;
  spread2?: number;
};

interface VoiceAnalysisVisualizerProps {
  voiceFeatures?: VoiceFeatures | null;
  loading?: boolean;
  assessments?: any[]; // Adding assessments property
}

// Dummy voice features data for when no real data is available
const DUMMY_VOICE_FEATURES: VoiceFeatures = {
  mdvpFo: 154.23,
  mdvpFhi: 197.10,
  mdvpFlo: 116.82,
  mdvpJitter: 0.00662,
  mdvpShimmer: 0.04374,
  nhr: 0.01309,
  hnr: 21.64,
  rpde: 0.513,
  dfa: 0.6845,
  spread1: -6.759,
  spread2: 0.227
};

const VoiceAnalysisVisualizer: React.FC<VoiceAnalysisVisualizerProps> = ({ 
  voiceFeatures = null,
  loading = false,
  assessments = []
}) => {
  const { theme } = useContext(UserContext);
  const isDarkMode = theme === 'dark';
  const [chartType, setChartType] = useState<'bar' | 'radar' | 'line' | 'pie' | 'area'>('bar');
  
  const coreVoiceKeys: (keyof VoiceFeatures)[] = ['mdvpFo', 'mdvpJitter', 'mdvpShimmer', 'nhr', 'hnr'];
  
  // Check if we have assessments data with voice features
  const hasAssessmentsWithVoice = assessments && assessments.length > 0 && 
    assessments.some(a => a.features && coreVoiceKeys.some(key => 
      a.features[key] !== undefined && a.features[key] !== null && !isNaN(Number(a.features[key]))
    ));

  // Check if the provided voiceFeatures has at least one of the core voice metrics.
  const hasActualVoiceData = (voiceFeatures && coreVoiceKeys.some(key => {
    const value = voiceFeatures[key];
    return value !== undefined && value !== null && !isNaN(Number(value));
  })) || hasAssessmentsWithVoice;

  console.log('VoiceAnalysisVisualizer - Input voiceFeatures:', voiceFeatures);
  console.log('VoiceAnalysisVisualizer - Has assessments with voice:', hasAssessmentsWithVoice);
  console.log('VoiceAnalysisVisualizer - Has actual voice data:', hasActualVoiceData);

  // Extract only the voice-related features if we have actual data
  let extractedVoiceFeatures: VoiceFeatures | null = null;
  
  if (hasActualVoiceData) {
    if (voiceFeatures) {
      extractedVoiceFeatures = {
        mdvpFo: voiceFeatures.mdvpFo,
        mdvpFhi: voiceFeatures.mdvpFhi,
        mdvpFlo: voiceFeatures.mdvpFlo,
        mdvpJitter: voiceFeatures.mdvpJitter,
        mdvpShimmer: voiceFeatures.mdvpShimmer,
        nhr: voiceFeatures.nhr,
        hnr: voiceFeatures.hnr,
        rpde: voiceFeatures.rpde,
        dfa: voiceFeatures.dfa,
        spread1: voiceFeatures.spread1,
        spread2: voiceFeatures.spread2
      };
    } else if (hasAssessmentsWithVoice) {
      // Use the most recent assessment with voice data
      const assessmentWithVoice = [...assessments]
        .filter(a => a.voiceRecorded && a.features)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      if (assessmentWithVoice && assessmentWithVoice.features) {
        extractedVoiceFeatures = {
          mdvpFo: assessmentWithVoice.features.mdvpFo,
          mdvpFhi: assessmentWithVoice.features.mdvpFhi,
          mdvpFlo: assessmentWithVoice.features.mdvpFlo,
          mdvpJitter: assessmentWithVoice.features.mdvpJitter,
          mdvpShimmer: assessmentWithVoice.features.mdvpShimmer,
          nhr: assessmentWithVoice.features.nhr,
          hnr: assessmentWithVoice.features.hnr,
          rpde: assessmentWithVoice.features.rpde,
          dfa: assessmentWithVoice.features.dfa,
          spread1: assessmentWithVoice.features.spread1,
          spread2: assessmentWithVoice.features.spread2
        };
      }
    }
  }
  
  const dataToUse = extractedVoiceFeatures || DUMMY_VOICE_FEATURES;
  const isUsingSampleData = !extractedVoiceFeatures; // True if using DUMMY_VOICE_FEATURES
  
  console.log('VoiceAnalysisVisualizer - Using data:', dataToUse);
  console.log('VoiceAnalysisVisualizer - Is using sample data:', isUsingSampleData);
  
  if (loading) {
    return (
      <Card className="card-gradient-blue dark:bg-gradient-to-br dark:from-blue-900/30 dark:to-indigo-900/30">
        <CardHeader>
          <CardTitle className="dark:text-blue-300">Voice Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-muted-foreground animate-pulse">Processing voice analysis...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
    // Helper function to format voice data for visualization
  const formatVoiceData = (features: VoiceFeatures) => {
    // Ensure we have valid numbers for each feature
    const formatNumber = (value: number | undefined, decimals: number): string => {
      if (value === undefined || isNaN(Number(value))) return "N/A";
      return value.toFixed(decimals);
    };
    
    return [
      { 
        name: "Frequency (Fo)", 
        value: normalizeVoiceFeature(features.mdvpFo, 100, 200), 
        referenceValue: normalizeVoiceFeature(150, 100, 200), 
        raw: formatNumber(features.mdvpFo, 2), 
        referenceRaw: "150.00" 
      },
      { 
        name: "Jitter", 
        value: normalizeVoiceFeature(features.mdvpJitter, 0, 0.01) * 100, 
        referenceValue: normalizeVoiceFeature(0.004, 0, 0.01) * 100, 
        raw: formatNumber(features.mdvpJitter, 4), 
        referenceRaw: "0.0040" 
      },
      { 
        name: "Shimmer", 
        value: normalizeVoiceFeature(features.mdvpShimmer, 0, 0.06) * 100, 
        referenceValue: normalizeVoiceFeature(0.03, 0, 0.06) * 100, 
        raw: formatNumber(features.mdvpShimmer, 4), 
        referenceRaw: "0.0300" 
      },
      { 
        name: "NHR", 
        value: normalizeVoiceFeature(features.nhr, 0, 0.05) * 100, 
        referenceValue: normalizeVoiceFeature(0.01, 0, 0.05) * 100, 
        raw: formatNumber(features.nhr, 4), 
        referenceRaw: "0.0100" 
      },
      { 
        name: "HNR", 
        value: normalizeVoiceFeature(features.hnr, 0, 30), 
        referenceValue: normalizeVoiceFeature(22, 0, 30), 
        raw: formatNumber(features.hnr, 2), 
        referenceRaw: "22.00" 
      }
    ];
  };  // Format data for visualization - use the helper function
  const chartData = formatVoiceData(dataToUse);
  console.log('VoiceAnalysisVisualizer - Formatted chart data:', chartData);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-2 rounded-md shadow-md dark:bg-zinc-900 dark:border-zinc-700">
          <p className="font-medium">{label}</p>
          <p className="text-sm">Your value: <span className="font-mono">{payload[0].payload.raw}</span></p>
          {payload.length > 1 && (
            <p className="text-sm">Reference: <span className="font-mono">{payload[1].payload.referenceRaw}</span></p>
          )}
        </div>
      );
    }
    return null;
  };
  // Display the appropriate card based on whether we have real or dummy data
  const cardClassNames = isUsingSampleData && !loading
    ? "card-gradient-blue dark:bg-gradient-to-br dark:from-blue-900/30 dark:to-indigo-900/30 h-full w-full flex flex-col"
    : "card-gradient-purple dark:bg-gradient-to-br dark:from-purple-900/30 dark:to-indigo-900/30 h-full w-full flex flex-col";

  const cardTitleText = isUsingSampleData && !loading
    ? "Voice Analysis (Sample Data)"
    : hasAssessmentsWithVoice && !voiceFeatures
    ? "Voice Analysis (Assessment Data)"
    : "Voice Analysis Visualization";
    
  return (
    <Card className={cardClassNames}>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className={isUsingSampleData && !loading ? "dark:text-blue-300" : "text-purple-700 dark:text-purple-300"}>
          {cardTitleText}
        </CardTitle>
        {isUsingSampleData && !loading && (
          <p className="text-xs text-muted-foreground">
            Showing sample data as actual voice metrics are incomplete or missing.
          </p>
        )}
        {/* Message when using assessment data */}
        {!isUsingSampleData && hasAssessmentsWithVoice && !voiceFeatures && !loading && (
          <p className="text-xs text-muted-foreground">
            Showing voice data from your most recent assessment.
          </p>
        )}
        {/* Optional: Message if voiceFeatures is an empty object and not loading */}
        {!isUsingSampleData && voiceFeatures && Object.keys(voiceFeatures).length === 0 && !loading && (
           <p className="text-xs text-muted-foreground">
            No voice features were provided for analysis.
           </p>
        )}
        <div className="mt-2 text-sm text-muted-foreground">
          <p className="mb-1"><span className="font-semibold">Purpose:</span> This visualization analyzes acoustic properties of your voice that may indicate early Parkinson's symptoms.</p>
          <p className="mb-1"><span className="font-semibold">What it shows:</span> Five key voice biomarkers compared to reference values:</p>
          <ul className="list-disc list-inside ml-2 mb-1">
            <li><span className="font-semibold">Frequency (Fo):</span> Average vocal pitch (Hz)</li>
            <li><span className="font-semibold">Jitter:</span> Cycle-to-cycle variations in pitch (vocal instability)</li>
            <li><span className="font-semibold">Shimmer:</span> Variations in amplitude (volume irregularity)</li>
            <li><span className="font-semibold">NHR:</span> Noise-to-Harmonics Ratio (breathiness/hoarseness)</li>
            <li><span className="font-semibold">HNR:</span> Harmonics-to-Noise Ratio (voice clarity)</li>
          </ul>
          <p><span className="font-semibold">Technical note:</span> Values are normalized to a 0-100 scale for comparison. Higher jitter and shimmer with lower HNR may indicate vocal impairment.</p>
        </div>
      </CardHeader>
      <CardContent className="p-3 flex-grow flex flex-col">
        <Tabs value={chartType} onValueChange={(value) => setChartType(value as any)}>
          <TabsList className="bg-white/80 dark:bg-zinc-800/80 w-fit gap-1 mb-3">
            <TabsTrigger value="bar" className="px-2 text-xs sm:text-sm sm:px-3">Bar</TabsTrigger>
            <TabsTrigger value="radar" className="px-2 text-xs sm:text-sm sm:px-3">Radar</TabsTrigger>
            <TabsTrigger value="line" className="px-2 text-xs sm:text-sm sm:px-3">Line</TabsTrigger>
            <TabsTrigger value="area" className="px-2 text-xs sm:text-sm sm:px-3">Area</TabsTrigger>
            <TabsTrigger value="pie" className="px-2 text-xs sm:text-sm sm:px-3">Pie</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="bg-white/50 dark:bg-zinc-900/50 dark:border-zinc-800 rounded-lg p-1 h-[300px]">
        <>
          <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' && (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }} barGap={4} barCategoryGap={15} maxBarSize={35}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} />
                  <XAxis 
                    dataKey="name" 
                    angle={-30} 
                    textAnchor="end" 
                    height={55} 
                    tick={{ fontSize: 9, fill: isDarkMode ? '#E5E7EB' : '#4B5563' }}
                    stroke={isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Value', 
                      angle: -90, 
                      position: 'insideLeft', 
                      style: { fill: isDarkMode ? '#E5E7EB' : '#4B5563', fontSize: 9 } 
                    }}
                    tick={{ fontSize: 9, fill: isDarkMode ? '#E5E7EB' : '#4B5563' }}
                    stroke={isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}
                  />                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: 5, fontSize: 9 }} 
                    iconType="circle" 
                    iconSize={8} 
                    formatter={(value) => <span style={{ color: isDarkMode ? '#F3F4F6' : '#374151' }}>{value}</span>} 
                  />
                  <Bar dataKey="value" name="Your Voice" fill={isDarkMode ? DARK_CHART_COLORS[0] : CHART_COLORS[0]} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="referenceValue" name="Reference" fill={isDarkMode ? DARK_CHART_COLORS[1] : CHART_COLORS[1]} radius={[3, 3, 0, 0]} fillOpacity={0.8} />
                  <ReferenceLine y={50} stroke={isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(102, 102, 102, 0.5)'} strokeDasharray="3 3" />
                </BarChart>
              )}
              {chartType === 'radar' && (
                <RadarChart outerRadius="80%" data={chartData} cx="50%" cy="50%" margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <PolarGrid stroke={isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'} />
                  <PolarAngleAxis 
                    dataKey="name" 
                    tick={{ 
                      fill: isDarkMode ? '#E5E7EB' : '#4B5563', 
                      fontSize: 9
                    }}
                    tickSize={3}
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={{ 
                      fill: isDarkMode ? '#E5E7EB' : '#4B5563', 
                      fontSize: 8
                    }} 
                    axisLine={false}
                    tickCount={4}
                  />
                  <Radar 
                    name="Your Voice" 
                    dataKey="value" 
                    stroke={isDarkMode ? DARK_CHART_COLORS[0] : CHART_COLORS[0]} 
                    fill={isDarkMode ? DARK_CHART_COLORS[0] : CHART_COLORS[0]} 
                    fillOpacity={0.5} 
                    activeDot={{ r: 3 }}
                  />
                  <Radar 
                    name="Reference" 
                    dataKey="referenceValue" 
                    stroke={isDarkMode ? DARK_CHART_COLORS[1] : CHART_COLORS[1]} 
                    fill={isDarkMode ? DARK_CHART_COLORS[1] : CHART_COLORS[1]} 
                    fillOpacity={0.5}
                    activeDot={{ r: 3 }} 
                  />
                  <Legend formatter={(value) => <span style={{ color: isDarkMode ? '#F3F4F6' : '#374151' }}>{value}</span>} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              )}
              {chartType === 'line' && (
                <LineChart data={chartData} margin={{ top: 10, right: 5, left: 5, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} />
                  <XAxis 
                    dataKey="name" 
                    angle={-30} 
                    textAnchor="end" 
                    height={45} 
                    tick={{ fontSize: 9, fill: isDarkMode ? '#E5E7EB' : '#4B5563' }}
                    stroke={isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Value', 
                      angle: -90, 
                      position: 'insideLeft', 
                      style: { fill: isDarkMode ? '#E5E7EB' : '#4B5563', fontSize: 9 } 
                    }}
                    stroke={isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}
                    tick={{ fontSize: 9, fill: isDarkMode ? '#E5E7EB' : '#4B5563' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 5, fontSize: 9 }} formatter={(value) => <span style={{ color: isDarkMode ? '#F3F4F6' : '#374151' }}>{value}</span>} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name="Your Voice" 
                    stroke={isDarkMode ? DARK_CHART_COLORS[0] : CHART_COLORS[0]} 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: isDarkMode ? DARK_CHART_COLORS[0] : CHART_COLORS[0] }} 
                    activeDot={{ r: 5 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="referenceValue" 
                    name="Reference" 
                    stroke={isDarkMode ? DARK_CHART_COLORS[1] : CHART_COLORS[1]} 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: isDarkMode ? DARK_CHART_COLORS[1] : CHART_COLORS[1] }} 
                    activeDot={{ r: 5 }}
                  />
                  <ReferenceLine y={50} stroke={isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(102, 102, 102, 0.5)'} strokeDasharray="3 3" />
                </LineChart>
              )}
              {chartType === 'area' && (
                <AreaChart data={chartData} margin={{ top: 10, right: 5, left: 5, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} />
                  <XAxis 
                    dataKey="name" 
                    angle={-30} 
                    textAnchor="end" 
                    height={45} 
                    tick={{ fontSize: 9, fill: isDarkMode ? '#E5E7EB' : '#4B5563' }}
                    stroke={isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}
                  />
                  <YAxis 
                    label={{ 
                      value: 'Value', 
                      angle: -90, 
                      position: 'insideLeft', 
                      style: { fill: isDarkMode ? '#E5E7EB' : '#4B5563', fontSize: 9 } 
                    }}
                    tick={{ fontSize: 9, fill: isDarkMode ? '#E5E7EB' : '#4B5563' }}
                    stroke={isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 5, fontSize: 9 }} iconType="circle" iconSize={8} formatter={(value) => <span style={{ color: isDarkMode ? '#F3F4F6' : '#374151' }}>{value}</span>} />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    name="Your Voice" 
                    stroke={isDarkMode ? DARK_CHART_COLORS[0] : CHART_COLORS[0]} 
                    fill={isDarkMode ? DARK_CHART_COLORS[0] : CHART_COLORS[0]} 
                    fillOpacity={0.4}
                    activeDot={{ r: 4 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="referenceValue" 
                    name="Reference" 
                    stroke={isDarkMode ? DARK_CHART_COLORS[1] : CHART_COLORS[1]} 
                    fill={isDarkMode ? DARK_CHART_COLORS[1] : CHART_COLORS[1]} 
                    fillOpacity={0.4}
                  />
                  <ReferenceLine y={50} stroke={isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(102, 102, 102, 0.5)'} strokeDasharray="3 3" />
                </AreaChart>
              )}
              {chartType === 'pie' && (
                <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 5, fontSize: 9 }} formatter={(value) => <span style={{ color: isDarkMode ? '#F3F4F6' : '#374151' }}>{value}</span>} />
                  <Pie 
                    data={chartData.filter(d => d.value > 0)} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="45%" 
                    outerRadius="70%" 
                    innerRadius="30%"
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text x={x} y={y} fill={isDarkMode ? "#F9FAFB" : "#1F2937"} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={9}>
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {chartData.filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={(isDarkMode ? DARK_CHART_COLORS : CHART_COLORS)[index % (isDarkMode ? DARK_CHART_COLORS : CHART_COLORS).length]} />
                    ))}
                  </Pie>
                </PieChart>
              )}
          </ResponsiveContainer>
        </>
        </div>
        {/* Voice analysis explanation - compact layout */}
        <div className="mt-2 text-xs text-muted-foreground bg-white/50 dark:bg-zinc-800/50 p-2 rounded-md flex items-center justify-between">
          <div className="flex gap-3">
            <div>
              <span className="font-medium text-purple-700 dark:text-purple-300">Jitter:</span> Pitch
            </div>
            <div>
              <span className="font-medium text-purple-700 dark:text-purple-300">Shimmer:</span> Amplitude
            </div>
          </div>
          <div className="flex gap-3">
            <div>
              <span className="font-medium text-purple-700 dark:text-purple-300">NHR:</span> Noise
            </div>
            <div>
              <span className="font-medium text-purple-700 dark:text-purple-300">HNR:</span> Harmonics
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceAnalysisVisualizer;
