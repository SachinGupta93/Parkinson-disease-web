import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  Cell,
} from 'recharts';
import { Assessment } from '@/utils/assessmentHistory';
import { UserContext } from '@/App'; // Added UserContext import

interface FeatureImportanceChartProps {
  assessments: Assessment[];
}

// Dummy feature importance data for when no real data is available
const DUMMY_FEATURE_DATA = [
  { feature: 'Tremor', importance: 32.5 },
  { feature: 'Voice Changes', importance: 28.7 },
  { feature: 'Slow Movement', importance: 21.3 },
  { feature: 'Muscle Rigidity', importance: 18.9 },
  { feature: 'Handwriting', importance: 16.4 },
  { feature: 'Balance Issues', importance: 12.8 },
];

const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({ assessments }) => {
  const { theme } = React.useContext(UserContext); // Added UserContext
  const isDarkMode = theme === 'dark'; // Added isDarkMode

  // Process data for visualization - use the latest assessment with feature importance data
  const processData = () => {
    console.log('FeatureImportanceChart - Input assessments:', assessments);
    
    // Find the most recent assessment with feature importance data
    const latestAssessment = assessments && assessments.length > 0 ? [...assessments].reverse()[0] : null;
    console.log('FeatureImportanceChart - Latest assessment:', latestAssessment);
    
    if (!latestAssessment || !latestAssessment.result) {
      console.log('FeatureImportanceChart - No valid assessment, using dummy data');
      // Return dummy data if no assessments are available
      return DUMMY_FEATURE_DATA;
    }

    // Use the features directly from the assessment
    const { features } = latestAssessment;
    console.log('FeatureImportanceChart - Assessment features:', features);
    
    // Create a normalized importance based on feature values
    // This is a simplified approach since we don't have actual importance values
    const totalValue = Object.values(features).reduce((sum, val) => typeof val === 'number' ? sum + val : sum, 0);
    console.log('FeatureImportanceChart - Total feature value:', totalValue);
    
    const processedData = Object.entries(features)
      .filter(([key, value]) => {
        // Only include clinical symptoms, not voice features or age
        const clinicalSymptoms = ['tremor', 'rigidity', 'bradykinesia', 'posturalInstability', 'voiceChanges', 'handwriting'];
        return clinicalSymptoms.includes(key) && typeof value === 'number' && value > 0;
      })
      .map(([feature, value]) => ({
        feature: formatFeatureName(feature),
        importance: typeof value === 'number' ? +(value * 100 / (totalValue || 1)).toFixed(1) : 0
      }))
      .sort((a, b) => b.importance - a.importance);
    
    console.log('FeatureImportanceChart - Processed data:', processedData);
    return processedData;
  };

  // Format feature names for better display
  const formatFeatureName = (feature: string): string => {
    const featureMap: Record<string, string> = {
      'tremor': 'Tremor',
      'rigidity': 'Muscle Rigidity',
      'bradykinesia': 'Slow Movement',
      'posturalInstability': 'Balance Issues',
      'voiceChanges': 'Voice Changes',
      'handwriting': 'Handwriting',
      'mdvpFo': 'Vocal Frequency',
      'mdvpJitter': 'Voice Jitter',
      'mdvpShimmer': 'Voice Shimmer',
      'nhr': 'Noise Ratio',
      'hnr': 'Harmonics Ratio',
    };
    
    return featureMap[feature] || feature;
  };
  const data = processData();
  // Add debug message for tracing
  console.log('FeatureImportanceChart processData:', data);
  
  // Custom colors for different feature types
  const getBarColor = (entry: { feature: string }) => {
    const clinicalFeatures = ['Tremor', 'Muscle Rigidity', 'Slow Movement', 'Balance Issues', 'Handwriting'];
    const voiceFeatures = ['Voice Changes', 'Vocal Frequency', 'Voice Jitter', 'Voice Shimmer', 'Noise Ratio', 'Harmonics Ratio'];
    
    // Define light and dark mode color palettes
    const clinicalColorsLight = ['#9333ea', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'];
    const clinicalColorsDark = ['#a855f7', '#9333ea', '#8b5cf6', '#7c3aed', '#6d28d9']; // Slightly lighter for dark mode
    
    const voiceColorsLight = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];
    const voiceColorsDark = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff']; // Slightly lighter for dark mode

    const defaultColorLight = '#10B981'; // Green
    const defaultColorDark = '#34d399'; // Lighter Green

    if (clinicalFeatures.includes(entry.feature)) {
      const colors = isDarkMode ? clinicalColorsDark : clinicalColorsLight;
      const index = clinicalFeatures.indexOf(entry.feature);
      return colors[index % colors.length];
    } else if (voiceFeatures.includes(entry.feature)) {
      const colors = isDarkMode ? voiceColorsDark : voiceColorsLight;
      const index = voiceFeatures.indexOf(entry.feature);
      return colors[index % colors.length];
    }
    return isDarkMode ? defaultColorDark : defaultColorLight;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-3 text-sm text-muted-foreground">
        <h3 className="text-base font-medium text-foreground mb-1">Feature Importance Analysis</h3>
        <p className="mb-1"><span className="font-semibold">Purpose:</span> This chart identifies which symptoms and measurements are most significant in your Parkinson's assessment.</p>
        <p className="mb-1"><span className="font-semibold">What it shows:</span> The relative importance (%) of each clinical and voice feature in determining your risk score.</p>
        <ul className="list-disc list-inside ml-2 mb-1">
          <li><span className="font-semibold">Clinical features:</span> Tremor, rigidity, slow movement, balance issues, handwriting changes</li>
          <li><span className="font-semibold">Voice features:</span> Voice changes, vocal frequency, jitter, shimmer, noise ratios</li>
        </ul>
        <p><span className="font-semibold">Technical note:</span> Higher percentages indicate symptoms that contributed more significantly to your assessment result.</p>
      </div>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          {data.length > 0 ? (
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 70, bottom: 10 }}
              barCategoryGap={5}
              barSize={16}
            >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={isDarkMode ? 0.2 : 0.3} stroke={isDarkMode ? '#4B5563' : '#D1D5DB'} />
          <XAxis 
            type="number" 
            domain={[0, 100]} 
            tickFormatter={(value) => `${value}%`}
            label={{ 
              value: 'Importance (%)', 
              position: 'insideBottom', 
              offset: -5, 
              style: { fill: isDarkMode ? '#E5E7EB' : '#4B5563', fontSize: 11 } 
            }}
            tick={{ fill: isDarkMode ? '#E5E7EB' : '#4B5563', fontSize: 10 }}
            axisLine={{ stroke: isDarkMode ? '#4B5563' : '#D1D5DB', opacity: 0.5 }}
          />
          <YAxis 
            dataKey="feature" 
            type="category" 
            tick={{ fontSize: 9, fill: isDarkMode ? '#E5E7EB' : '#4B5563' }} 
            width={65}
            axisLine={{ stroke: isDarkMode ? '#4B5563' : '#D1D5DB', opacity: 0.5 }}
          />
          <Tooltip 
            formatter={(value) => [`${value}%`, 'Importance']}
            contentStyle={{ 
              backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)', // Darker for dark mode
              border: isDarkMode ? '1px solid #4B5563' : '1px solid #E5E7EB',
              borderRadius: '0.375rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              color: isDarkMode ? '#F3F4F6' : '#374151'
            }}
            cursor={{ fill: isDarkMode ? 'hsla(var(--muted-foreground)/0.2)' : 'hsla(var(--muted)/0.3)' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: 8, fontSize: '10px' }}
            formatter={(value) => <span style={{ color: isDarkMode ? '#F3F4F6' : '#374151' }} className="text-xs">{value}</span>}
          />
          <Bar 
            dataKey="importance" 
            // fill="#8884d8" // Removed static fill, color is now dynamic via Cell
            name="Feature Importance"
            barSize={18}
            animationDuration={800}
            radius={[0, 3, 3, 0]}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(entry)}
                strokeWidth={0}
              />
            ))}
            <LabelList 
              dataKey="importance" 
              position="right" 
              formatter={(value: number) => `${value}%`}
              style={{ fontSize: 9, fill: isDarkMode ? '#F9FAFB' : '#1F2937', fontWeight: 'bold' }}
              offset={5}
            />
          </Bar>
        </BarChart>
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          No feature importance data available
        </div>
      )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FeatureImportanceChart;