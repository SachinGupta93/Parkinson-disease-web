import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  HelpCircle, Info, Activity, Volume2, Waves, Speaker, Mic, 
  Repeat, TrendingUp, ArrowUp, ArrowDown, BarChart, LineChart, 
  Box, Vibrate, Clock, Compass, PenTool, Calendar, Radio, HeartPulse,
  BarChart3, BarChart4
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FeatureImportanceProps {
  featureImportance: Record<string, number>;
  height?: number;
}

// Enhanced feature tooltips and descriptions with user-friendly explanations
interface FeatureInfo {
  tooltip: string;
  description: string;
  significance: string;
  icon?: string;
}

const featureDescriptions: Record<string, FeatureInfo> = {
  mdvpShimmer: {
    tooltip: "Voice amplitude variation",
    description: "Measures changes in voice volume during speech",
    significance: "Higher values may indicate voice tremor or weakness common in Parkinson's disease. Normal values are typically below 3.8%.",
    icon: "volume"
  },
  mdvpJitter: {
    tooltip: "Voice frequency variation",
    description: "Measures instability in vocal cord vibration",
    significance: "Higher values suggest vocal cord instability which is often an early sign of neurological disorders. Normal values are typically below 1.0%.",
    icon: "activity"
  },
  hnr: {
    tooltip: "Harmonics-to-Noise Ratio",
    description: "Measures voice clarity and quality",
    significance: "Lower values indicate poorer voice quality and more noise in speech, common in Parkinson's. Healthy voices typically have values above 20 dB.",
    icon: "waves"
  },
  nhr: {
    tooltip: "Noise-to-Harmonics Ratio",
    description: "Measures noise levels in voice",
    significance: "Higher values indicate voice disorder and reduced speech clarity. In Parkinson's disease, this value is often elevated due to turbulent airflow during phonation.",
    icon: "speaker"
  },
  mdvpFo: {
    tooltip: "Average vocal frequency",
    description: "The average pitch of your voice",
    significance: "Changes in average frequency may indicate neurological effects on vocal muscles. Typical healthy range is 120-210 Hz, with variations based on sex and age.",
    icon: "mic"
  },
  rpde: {
    tooltip: "Recurrence Period Density Entropy",
    description: "Measures voice pattern regularity",
    significance: "Higher values suggest more disordered voice patterns often seen in neurological conditions. In Parkinson's disease, this value is typically elevated due to unpredictable voice patterns.",
    icon: "repeat"
  },
  dfa: {
    tooltip: "Detrended Fluctuation Analysis",
    description: "Measures long-term voice patterns",
    significance: "Abnormal values indicate disrupted speech timing and rhythm. This is a nonlinear measure that detects subtle changes in vocal fold dynamics that may not be apparent in other measures.",
    icon: "trending-up"
  },
  mdvpFhi: {
    tooltip: "Maximum vocal frequency",
    description: "The highest pitch your voice can reach",
    significance: "Reduced maximum range may indicate disease progression. People with Parkinson's often show reduced frequency range, indicating reduced vocal flexibility.",
    icon: "arrow-up"
  },
  mdvpFlo: {
    tooltip: "Minimum vocal frequency",
    description: "The lowest pitch your voice can reach",
    significance: "Changes suggest reduced vocal flexibility and control. A narrowing gap between minimum and maximum frequencies is often observed in Parkinson's disease.",
    icon: "arrow-down"
  },
  spread1: {
    tooltip: "Frequency variation spread (1)",
    description: "Nonlinear measure of frequency variation",
    significance: "Abnormal values indicate disrupted speech control. This complex mathematical measure helps detect subtle changes in vocal patterns that simpler measures might miss.",
    icon: "bar-chart"
  },
  spread2: {
    tooltip: "Frequency variation spread (2)",
    description: "Second nonlinear measure of frequency variation",
    significance: "Another indicator of speech pattern disruption that measures different aspects of vocal fold dynamics than spread1.",
    icon: "line-chart"
  },
  ppe: {
    tooltip: "Pitch Period Entropy",
    description: "Measures voice regularity and predictability",
    significance: "Higher values indicate irregular speech patterns common in Parkinson's. This measure evaluates the unpredictability of voice pitch patterns over time.",
    icon: "radio"
  },
  d2: {
    tooltip: "Correlation Dimension",
    description: "Measures voice signal complexity",
    significance: "Lower values may indicate reduced speech complexity due to neurological issues. In Parkinson's, this value is often decreased, showing a simplification of voice patterns.",
    icon: "box"
  },
  
  // Clinical features
  tremor: {
    tooltip: "Rest tremor",
    description: "Involuntary shaking when the body is at rest",
    significance: "Classic early sign of Parkinson's disease, affecting 70% of patients",
    icon: "vibrate"
  },
  rigidity: {
    tooltip: "Muscle stiffness",
    description: "Increased muscle tone causing stiffness",
    significance: "Makes movement difficult and can cause pain",
    icon: "grip"
  },
  bradykinesia: {
    tooltip: "Slowness of movement",
    description: "Difficulty initiating and maintaining movement",
    significance: "Core feature of Parkinson's affecting daily activities",
    icon: "clock"
  },
  posturalInstability: {
    tooltip: "Balance problems",
    description: "Difficulty maintaining balance and posture",
    significance: "Increases fall risk and usually appears in later stages",
    icon: "compass"
  },
  voiceChanges: {
    tooltip: "Speech changes",
    description: "Changes in speech volume, clarity, or tone",
    significance: "Often an early but overlooked symptom of Parkinson's",
    icon: "mic"
  },
  handwriting: {
    tooltip: "Handwriting changes",
    description: "Micrographia (small handwriting) or tremulous writing",
    significance: "Very specific indicator of Parkinson's disease",
    icon: "pen-tool"
  },
  age: {
    tooltip: "Age factor",
    description: "Risk increases with age",
    significance: "Most cases develop after age 60",
    icon: "calendar"
  }
};

// Function to get feature tooltip information
const getFeatureInfo = (name: string): FeatureInfo => {
  // Convert keys from API format to our format (e.g., "mdvp_fo" to "mdvpFo")
  const normalizedName = name
    .replace(/_([a-z])/g, (g) => g[1].toUpperCase())
    .replace(/^([A-Z])/, (g) => g.toLowerCase());
  
  // Try exact match first
  if (featureDescriptions[normalizedName]) {
    return featureDescriptions[normalizedName];
  }
  
  // Try case-insensitive match
  const key = Object.keys(featureDescriptions).find(
    k => k.toLowerCase() === normalizedName.toLowerCase()
  );
  
  return key 
    ? featureDescriptions[key]
    : {
        tooltip: formatFeatureName(name),
        description: "Feature measurement from voice analysis",
        significance: "Contributes to the overall prediction model",
        icon: "help-circle"
      };
};

// Function to format feature names for display
const formatFeatureName = (name: string): string => {
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/Mdvp/i, 'MDVP')
    .replace(/Hnr/i, 'HNR')
    .replace(/Nhr/i, 'NHR')
    .replace(/Dfa/i, 'DFA')
    .replace(/Rpde/i, 'RPDE')
    .replace(/Ppe/i, 'PPE');
};

const FeatureImportance: React.FC<FeatureImportanceProps> = ({ featureImportance = {}, height = 400 }) => {
  // Early return if no feature importance data
  if (!featureImportance || Object.keys(featureImportance).length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Feature Importance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No feature importance data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort features by importance (descending)
  const sortedFeatures = Object.entries(featureImportance)
    .filter(([, value]) => typeof value === 'number' && !isNaN(value))
    .sort(([, valueA], [, valueB]) => valueB - valueA);
  
  // Import icons based on feature descriptions
  const getIconForFeature = (featureName: string) => {
    const info = getFeatureInfo(featureName);
    const iconName = info.icon || 'help-circle';
    
    // Use a color based on the feature type
    const getColorClass = (feature: string) => {
      if (feature.includes('jitter') || feature.includes('Jitter')) {
        return "text-blue-600";
      } else if (feature.includes('shimmer') || feature.includes('Shimmer')) {
        return "text-red-600";
      } else if (feature.includes('fo') || feature.includes('Fo') || 
                feature.includes('fhi') || feature.includes('flo')) {
        return "text-green-600";
      } else if (feature === 'hnr' || feature === 'nhr') {
        return "text-amber-600";
      } else if (feature === 'rpde' || feature === 'dfa') {
        return "text-purple-600";
      } else {
        return "text-indigo-600";
      }
    };
    
    const colorClass = getColorClass(featureName.toLowerCase());
    
    // Dynamically import icons from Lucide React based on the icon name
    switch(iconName) {
      case 'volume': return <Volume2 className={`h-4 w-4 ${colorClass}`} />;
      case 'activity': return <Activity className={`h-4 w-4 ${colorClass}`} />;
      case 'waves': return <Waves className={`h-4 w-4 ${colorClass}`} />;
      case 'speaker': return <Speaker className={`h-4 w-4 ${colorClass}`} />;
      case 'mic': return <Mic className={`h-4 w-4 ${colorClass}`} />;
      case 'repeat': return <Repeat className={`h-4 w-4 ${colorClass}`} />;
      case 'trending-up': return <TrendingUp className={`h-4 w-4 ${colorClass}`} />;
      case 'arrow-up': return <ArrowUp className={`h-4 w-4 ${colorClass}`} />;
      case 'arrow-down': return <ArrowDown className={`h-4 w-4 ${colorClass}`} />;
      case 'bar-chart': return <BarChart className={`h-4 w-4 ${colorClass}`} />;
      case 'line-chart': return <LineChart className={`h-4 w-4 ${colorClass}`} />;
      case 'waveform': return <Waves className={`h-4 w-4 ${colorClass}`} />;
      case 'box': return <Box className={`h-4 w-4 ${colorClass}`} />;
      case 'vibrate': return <Vibrate className={`h-4 w-4 ${colorClass}`} />;
      case 'radio': return <Radio className={`h-4 w-4 ${colorClass}`} />; // Added radio icon
      case 'clock': return <Clock className={`h-4 w-4 ${colorClass}`} />;
      case 'compass': return <Compass className={`h-4 w-4 ${colorClass}`} />;
      case 'pen-tool': return <PenTool className={`h-4 w-4 ${colorClass}`} />;
      case 'calendar': return <Calendar className={`h-4 w-4 ${colorClass}`} />;
      default: return <HelpCircle className={`h-4 w-4 ${colorClass}`} />;
    }
  };
  
  // Feature name formatting
  const formatFeatureName = (name: string): string => {
    // Handle special cases first
    const specialCases: Record<string, string> = {
      'ppe': 'PPE',
      'nhr': 'NHR', 
      'hnr': 'HNR',
      'dfa': 'DFA',
      'rpde': 'RPDE',
      'd2': 'D2',
      'mdvp_fo': 'MDVP F0(Hz)',
      'mdvp_fhi': 'MDVP Fhi(Hz)',
      'mdvp_flo': 'MDVP Flo(Hz)',
      'jitter_ddp': 'Jitter DDP',
      'shimmer_dda': 'Shimmer DDA',
      'shimmer_apq3': 'Shimmer APQ3',
      'shimmer_apq5': 'Shimmer APQ5',
      'mdvp_jitter': 'MDVP Jitter(%)',
      'mdvp_shimmer': 'MDVP Shimmer',
      'mdvp_rap': 'MDVP RAP',
      'mdvp_ppq': 'MDVP PPQ'
    };
    
    if (specialCases[name.toLowerCase()]) {
      return specialCases[name.toLowerCase()];
    }
    
    return name
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/_/g, ' ') // Replace underscores with spaces
      .trim();
  };
  
  const getFeatureDescription = (name: string): string => {
    const lowerName = name.toLowerCase();
    const info = getFeatureInfo(name);
    return info.description || 'This feature contributes to the overall assessment of Parkinson\'s disease risk.';
  };
  
  // Feature tooltips and descriptions
  const featureTooltips: Record<string, string> = {
    mdvp_shimmer: "Voice amplitude variation - Higher values may indicate voice tremor or weakness",
    mdvp_jitter: "Voice frequency variation - Higher values suggest vocal cord instability",
    hnr: "Harmonics-to-Noise Ratio - Lower values indicate poorer voice quality",
    nhr: "Noise-to-Harmonics Ratio - Higher values indicate voice disorder",
    mdvp_fo: "Average vocal frequency - Changes may indicate neurological effects",
    rpde: "Recurrence Period Density Entropy - Measures voice complexity",
    dfa: "Detrended Fluctuation Analysis - Long-range correlations in voice",
    mdvp_fhi: "Maximum vocal frequency - Reduced range may indicate disease",
    mdvp_flo: "Minimum vocal frequency - Changes suggest reduced flexibility",
    spread1: "Nonlinear measure of fundamental frequency variation",
    spread2: "Second nonlinear measure of frequency variation",
    ppe: "Pitch Period Entropy - Voice irregularity measure",
    d2: "Correlation Dimension - Voice signal complexity",
    
    // Clinical features
    tremor: "Rest tremor - Classic early sign of Parkinson's",
    rigidity: "Muscle stiffness and resistance to movement",
    bradykinesia: "Slowness of movement",
    postural_instability: "Balance and coordination problems",
    voice_changes: "Changes in speech volume, clarity, or tone",
    handwriting: "Micrographia (small handwriting) or tremulous writing",
    age: "Risk increases with age, especially over 60"
  };
  
  // Create data for visualization
  const getVisualizationData = () => {
    // Get top 5 features for visualization
    const topFeatures = sortedFeatures.slice(0, 5);
    
    return {
      labels: topFeatures.map(([feature]) => formatFeatureName(feature)),
      values: topFeatures.map(([, importance]) => {
        const safeImportance = isNaN(importance) || importance < 0 ? 0 : importance;
        return parseFloat((safeImportance * 100).toFixed(1));
      }),
      colors: topFeatures.map(([feature]) => {
        const lowerFeature = feature.toLowerCase();
        if (lowerFeature.includes('jitter')) return 'rgba(59, 130, 246, 0.8)'; // blue
        if (lowerFeature.includes('shimmer')) return 'rgba(239, 68, 68, 0.8)'; // red
        if (lowerFeature.includes('fo') || lowerFeature.includes('fhi') || lowerFeature.includes('flo')) 
          return 'rgba(34, 197, 94, 0.8)'; // green
        if (lowerFeature === 'hnr' || lowerFeature === 'nhr') 
          return 'rgba(245, 158, 11, 0.8)'; // amber
        if (lowerFeature === 'rpde' || lowerFeature === 'dfa') 
          return 'rgba(168, 85, 247, 0.8)'; // purple
        return 'rgba(99, 102, 241, 0.8)'; // indigo
      })
    };
  };

  // Simple bar chart visualization
  const FeatureBarChart = () => {
    const { labels, values, colors } = getVisualizationData();
    const maxValue = Math.max(...values);
    
    return (
      <div className="mt-4 mb-6">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-600" />
          Top Features Visualization
        </h4>
        <div className="space-y-3">
          {labels.map((label, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{label}</span>
                <span className="font-mono">{values[index]}%</span>
              </div>
              <div className="h-6 bg-secondary rounded-md overflow-hidden">
                <div 
                  className="h-full rounded-md transition-all duration-500"
                  style={{ 
                    width: `${(values[index] / maxValue) * 100}%`,
                    backgroundColor: colors[index]
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            Feature Importance
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Shows which features were most important for the AI model's prediction. Higher percentages indicate greater influence on the result.</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Feature Visualization */}
          {sortedFeatures.length > 0 && <FeatureBarChart />}
          
          {/* Feature Details */}
          <div className="space-y-4">
            {sortedFeatures.map(([feature, importance]) => {
              // Handle NaN values and negative values
              const safeImportance = isNaN(importance) || importance < 0 ? 0 : importance;
              const percentImportance = (safeImportance * 100).toFixed(1);
              
              return (
                <div key={feature} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex items-center gap-1">
                        {getIconForFeature(feature)}
                        <span className="font-medium text-sm">{formatFeatureName(feature)}</span>
                      </div>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm p-3">
                          <div className="space-y-2">
                            <p className="text-sm font-medium">{getFeatureInfo(feature).tooltip}</p>
                            <p className="text-xs">{getFeatureDescription(feature)}</p>
                            <p className="text-xs text-muted-foreground">{getFeatureInfo(feature).significance}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <span className="font-mono text-sm font-medium">{percentImportance}%</span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300" 
                        style={{ width: `${percentImportance}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getFeatureInfo(feature).description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> Feature importance shows how much each measurement contributed to your assessment. 
              Higher values indicate the feature had more influence on the prediction. This helps understand which
              aspects of your symptoms or voice analysis were most significant.
            </p>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default FeatureImportance;