import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Activity, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VoiceFeaturesProps {
  voiceFeatures: {
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
    d2?: number;
    ppe?: number;
  };
}

// Voice feature descriptions
const voiceFeatureDescriptions = {
  mdvpFo: {
    title: "Average Vocal Frequency",
    description: "The average pitch of your voice during sustained phonation",
    significance: "Changes in average frequency may indicate neurological effects on vocal muscles. Typical healthy range is 120-210 Hz."
  },
  mdvpFhi: {
    title: "Maximum Vocal Frequency",
    description: "The highest pitch your voice reached during recording",
    significance: "Reduced maximum range may indicate disease progression and reduced vocal flexibility."
  },
  mdvpFlo: {
    title: "Minimum Vocal Frequency",
    description: "The lowest pitch your voice reached during recording",
    significance: "Changes suggest reduced vocal flexibility and control. A narrowing gap between minimum and maximum frequencies is often observed in Parkinson's."
  },
  mdvpJitter: {
    title: "Jitter (Frequency Variation)",
    description: "Measures cycle-to-cycle variations in voice frequency",
    significance: "Higher values suggest vocal cord instability which is often an early sign of neurological disorders. Normal values are typically below 1.0%."
  },
  mdvpShimmer: {
    title: "Shimmer (Amplitude Variation)",
    description: "Measures changes in voice volume during speech",
    significance: "Higher values may indicate voice tremor or weakness common in Parkinson's disease. Normal values are typically below 3.8%."
  },
  nhr: {
    title: "Noise-to-Harmonics Ratio",
    description: "Measures noise levels in voice",
    significance: "Higher values indicate voice disorder and reduced speech clarity. In Parkinson's, this value is often elevated due to turbulent airflow during phonation."
  },
  hnr: {
    title: "Harmonics-to-Noise Ratio",
    description: "Measures voice clarity and quality",
    significance: "Lower values indicate poorer voice quality and more noise in speech, common in Parkinson's. Healthy voices typically have values above 20 dB."
  },
  rpde: {
    title: "Recurrence Period Density Entropy",
    description: "Measures voice pattern regularity and complexity",
    significance: "Higher values suggest more disordered voice patterns often seen in neurological conditions. In Parkinson's, this value is typically elevated."
  },
  dfa: {
    title: "Detrended Fluctuation Analysis",
    description: "Measures long-term voice patterns and correlations",
    significance: "Abnormal values indicate disrupted speech timing and rhythm. This nonlinear measure detects subtle changes in vocal fold dynamics."
  }
};

const VoiceFeatures: React.FC<VoiceFeaturesProps> = ({ voiceFeatures }) => {
  if (!voiceFeatures) return null;

  // Function to get description for a feature
  const getFeatureDescription = (featureKey: string) => {
    return voiceFeatureDescriptions[featureKey as keyof typeof voiceFeatureDescriptions] || {
      title: "Voice Feature",
      description: "A measurement from voice analysis",
      significance: "Contributes to the overall assessment"
    };
  };

  return (
    <TooltipProvider>
      <Card className="bg-white shadow-md rounded-lg dark:bg-gray-900">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold">Voice Features</h3>
          </div>

          <div className="text-sm text-green-600 mb-4 dark:text-green-400">
            Ready for Combined Analysis
          </div>

          <p className="text-sm text-gray-600 mb-6 dark:text-gray-300">
            These voice features will be combined with your clinical symptoms for a comprehensive assessment.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-1 mb-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Avg. Frequency (Hz)</div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-blue-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-3">
                    <p className="font-medium text-sm">{getFeatureDescription('mdvpFo').title}</p>
                    <p className="text-xs mt-1">{getFeatureDescription('mdvpFo').description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{getFeatureDescription('mdvpFo').significance}</p>
                  </TooltipContent>
                </Tooltip>
              </div>              <div className="text-xl font-semibold">
                {(typeof voiceFeatures.mdvpFo === 'number' && !isNaN(voiceFeatures.mdvpFo)) ? voiceFeatures.mdvpFo.toFixed(3) : "N/A"}
              </div>
              <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                {getFeatureDescription('mdvpFo').description}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-1 mb-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Max Frequency (Hz)</div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-blue-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-3">
                    <p className="font-medium text-sm">{getFeatureDescription('mdvpFhi').title}</p>
                    <p className="text-xs mt-1">{getFeatureDescription('mdvpFhi').description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{getFeatureDescription('mdvpFhi').significance}</p>
                  </TooltipContent>
                </Tooltip>
              </div>              <div className="text-xl font-semibold">
                {(typeof voiceFeatures.mdvpFhi === 'number' && !isNaN(voiceFeatures.mdvpFhi)) ? voiceFeatures.mdvpFhi.toFixed(3) : "N/A"}
              </div>
              <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                {getFeatureDescription('mdvpFhi').description}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-1 mb-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Min Frequency (Hz)</div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-blue-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-3">
                    <p className="font-medium text-sm">{getFeatureDescription('mdvpFlo').title}</p>
                    <p className="text-xs mt-1">{getFeatureDescription('mdvpFlo').description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{getFeatureDescription('mdvpFlo').significance}</p>
                  </TooltipContent>
                </Tooltip>
              </div>              <div className="text-xl font-semibold">
                {(typeof voiceFeatures.mdvpFlo === 'number' && !isNaN(voiceFeatures.mdvpFlo)) ? voiceFeatures.mdvpFlo.toFixed(3) : "N/A"}
              </div>
              <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                {getFeatureDescription('mdvpFlo').description}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-1 mb-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Jitter (%)</div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-blue-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-3">
                    <p className="font-medium text-sm">{getFeatureDescription('mdvpJitter').title}</p>
                    <p className="text-xs mt-1">{getFeatureDescription('mdvpJitter').description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{getFeatureDescription('mdvpJitter').significance}</p>
                  </TooltipContent>
                </Tooltip>
              </div>              <div className="text-xl font-semibold">
                {(typeof voiceFeatures.mdvpJitter === 'number' && !isNaN(voiceFeatures.mdvpJitter)) ? 
                  (voiceFeatures.mdvpJitter * 100).toFixed(3) : "N/A"}
              </div>
              <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                {getFeatureDescription('mdvpJitter').description}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-1 mb-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Shimmer (%)</div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-blue-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-3">
                    <p className="font-medium text-sm">{getFeatureDescription('mdvpShimmer').title}</p>
                    <p className="text-xs mt-1">{getFeatureDescription('mdvpShimmer').description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{getFeatureDescription('mdvpShimmer').significance}</p>
                  </TooltipContent>
                </Tooltip>
              </div>              <div className="text-xl font-semibold">
                {(typeof voiceFeatures.mdvpShimmer === 'number' && !isNaN(voiceFeatures.mdvpShimmer)) ? 
                  (voiceFeatures.mdvpShimmer * 100).toFixed(3) : "N/A"}
              </div>
              <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                {getFeatureDescription('mdvpShimmer').description}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-1 mb-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Noise-Harmonic Ratio</div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-blue-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-3">
                    <p className="font-medium text-sm">{getFeatureDescription('nhr').title}</p>
                    <p className="text-xs mt-1">{getFeatureDescription('nhr').description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{getFeatureDescription('nhr').significance}</p>
                  </TooltipContent>
                </Tooltip>
              </div>              <div className="text-xl font-semibold">
                {(typeof voiceFeatures.nhr === 'number' && !isNaN(voiceFeatures.nhr)) ? voiceFeatures.nhr.toFixed(3) : "N/A"}
              </div>
              <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                {getFeatureDescription('nhr').description}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-1 mb-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Harmonic-Noise Ratio</div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-blue-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-3">
                    <p className="font-medium text-sm">{getFeatureDescription('hnr').title}</p>
                    <p className="text-xs mt-1">{getFeatureDescription('hnr').description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{getFeatureDescription('hnr').significance}</p>
                  </TooltipContent>
                </Tooltip>
              </div>              <div className="text-xl font-semibold">
                {(typeof voiceFeatures.hnr === 'number' && !isNaN(voiceFeatures.hnr)) ? voiceFeatures.hnr.toFixed(3) : "N/A"}
              </div>
              <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                {getFeatureDescription('hnr').description}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-1 mb-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Pattern Dynamics</div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-blue-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-3">
                    <p className="font-medium text-sm">{getFeatureDescription('rpde').title}</p>
                    <p className="text-xs mt-1">{getFeatureDescription('rpde').description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{getFeatureDescription('rpde').significance}</p>
                  </TooltipContent>
                </Tooltip>
              </div>              <div className="text-xl font-semibold">
                {(typeof voiceFeatures.rpde === 'number' && !isNaN(voiceFeatures.rpde)) ? voiceFeatures.rpde.toFixed(3) : "N/A"}
              </div>
              <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                {getFeatureDescription('rpde').description}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <AlertCircle className="h-4 w-4" />
            <span>Voice recordings are processed locally and never stored on our servers</span>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default VoiceFeatures;
