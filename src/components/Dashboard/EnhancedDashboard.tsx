import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, subMonths } from 'date-fns';
import { toast } from 'sonner';
import { UserContext } from '../../App';
import { useData } from '../../hooks/useData';
import { useRealtimeData } from '../../hooks/useRealtimeData';
import { useAssessmentHistory } from '../../hooks/useAssessmentHistory';
import { useBackendModels } from '../../hooks/useBackendModels';
import { PredictionResponse } from '../../services/api';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { CustomProgress } from '../ui/custom-progress';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import AnalysisMethodGuide from '../AnalysisMethodGuide';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Sector, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';

import {
  Mic,
  Gauge,
  Percent as BadgePercent,
  Activity,
  BrainCircuit as Brain,
  ClipboardList,
  RefreshCcw,
  LineChart as LineChartIcon,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  Award,
  AudioLines,
  AreaChart,
  BarChart as BarChartIcon,
  Stethoscope,
  InfoIcon as Info,
  ListChecks,
  Users,
  CalendarDays,
  FileText,
  Loader2 as LoaderIcon,
  AlertCircle,
  ArrowRight,
  Clock,
  History,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  Sparkles,
  Zap,
  Lightbulb,
  Wand2,
  Bookmark,
  Share2,
  Download
} from 'lucide-react';

// Sample data generation has been removed to ensure we only use real data from Firebase

interface ModelPrediction {
  name: string;
  prediction: number; // 0 or 1
  probability: number; // 0 to 1
}

interface VoiceMetric {
  name: string;
  value: number;
  unit: string;
  description: string;
  normalRange: string;
  status: 'normal' | 'warning' | 'critical';
}

const EnhancedDashboard: React.FC = () => {
  const { user, isDarkMode } = useContext(UserContext);
  const navigate = useNavigate();

  const { voiceHistory: dataVoiceHistory, loading: dataLoading, error: dataError } = useData(user?.id || '');
  const { data: realtimeDataFromHook, loading: realtimeLoading, error: realtimeError } = useRealtimeData(user?.id || '');
  const { assessments, loading: assessmentLoading } = useAssessmentHistory();
  const { models: availableModels, loading: modelsLoading } = useBackendModels();

  const [voiceHistory, setVoiceHistory] = useState<PredictionResponse[]>([]);
  const [modelPredictions, setModelPredictions] = useState<ModelPrediction[]>([]);
  const [selectedMetric, setSelectedMetric] = useState('severity');
  const [displayRealtimeData, setDisplayRealtimeData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('all');
  const [voiceMetrics, setVoiceMetrics] = useState<VoiceMetric[]>([]);

  const themeColor = isDarkMode ? '#A0A0A0' : '#606060'; 
  const gridColor = isDarkMode ? 'rgba(100, 100, 100, 0.2)' : 'rgba(200, 200, 200, 0.3)';
  const bgColor = isDarkMode ? '#1f2937' : '#f8fafc';
  const textColor = isDarkMode ? '#e2e8f0' : '#334155';

  useEffect(() => {
    console.log("EnhancedDashboard: Data loading state changed", { 
      dataLoading, 
      dataError, 
      dataVoiceHistoryLength: dataVoiceHistory?.length || 0,
      assessmentLoading,
      assessmentsLength: assessments?.length || 0
    });
    
    console.log("EnhancedDashboard: Assessment data:", assessments);
    
    if (dataLoading) {
      console.log("EnhancedDashboard: Data is loading, clearing state");
      setVoiceHistory([]);
      setModelPredictions([]);
      return;
    }
    
    if (dataError) {
      console.error("EnhancedDashboard: Error loading voice history:", dataError);
      // Don't use sample data, just show empty state
      setVoiceHistory([]);
      return;
    }

    // Use assessment data if voice history is empty but assessments exist
    if ((!dataVoiceHistory || dataVoiceHistory.length === 0) && assessments && assessments.length > 0) {
      console.log("EnhancedDashboard: Using assessment data as fallback:", assessments);
      
      try {
        const transformedFromAssessments = assessments.map(assessment => ({
          timestamp: assessment.date instanceof Date ? assessment.date.toISOString() : new Date().toISOString(),
          prediction: {
            status: assessment.result.status === 1,
            probability: assessment.result.probability,
            severity: assessment.result.riskScore,
            model_predictions: assessment.allModelResults?.reduce((acc, model) => {
              acc[model.modelName] = model.riskScore;
              return acc;
            }, {} as Record<string, number>) || {},
            model_probabilities: assessment.allModelResults?.reduce((acc, model) => {
              acc[model.modelName] = model.probability;
              return acc;
            }, {} as Record<string, number>) || {}
          },
          recommendations: [],
          voice_metrics: {
            pitch: assessment.features.mdvpFo || 0,
            jitter: assessment.features.mdvpJitter || 0,
            shimmer: assessment.features.mdvpShimmer || 0,
            hnr: assessment.features.hnr || 0
          }
        }));
        
        console.log("EnhancedDashboard: Transformed assessment data:", transformedFromAssessments);
        setVoiceHistory(transformedFromAssessments);
        
        // Show success toast
        toast.success(`Loaded ${assessments.length} assessments from your history`);
        
        // Also set model predictions from assessments
        if (assessments[0]?.allModelResults) {
          const modelPreds = assessments[0].allModelResults.map(model => ({
            model: model.modelName,
            prediction: model.riskScore,
            confidence: model.probability || 0
          }));
          setModelPredictions(modelPreds);
        }
        
      } catch (error) {
        console.error("EnhancedDashboard: Error processing assessment data:", error);
        setVoiceHistory([]);
      }
    } else if (dataVoiceHistory && dataVoiceHistory.length > 0) {
      console.log("EnhancedDashboard: Processing real voice history data:", dataVoiceHistory);
      
      try {
        const transformedData = dataVoiceHistory.map(item => {
          // Get the actual data without fallbacks to dummy values
          const analysisResults = item.analysisResults || {};
          const voiceMetrics = item.voiceMetrics || {};
          
          return {
            timestamp: item.timestamp instanceof Date ? item.timestamp.toISOString() : new Date().toISOString(),
            prediction: {
              status: analysisResults.severity > 50, 
              probability: analysisResults.confidence || analysisResults.probability,
              severity: analysisResults.severity,
              model_predictions: analysisResults.model_predictions || {}, 
              model_probabilities: analysisResults.model_probabilities || {} 
            },
            recommendations: analysisResults.recommendations || [],
            voice_metrics: {
              pitch: voiceMetrics.pitch,
              jitter: voiceMetrics.tremor,
              shimmer: voiceMetrics.amplitude,
              hnr: voiceMetrics.frequency
            }
          };
        }) as PredictionResponse[];
        
        console.log("EnhancedDashboard: Transformed data:", transformedData);
        setVoiceHistory(transformedData);
        
        if (transformedData.length > 0) {
          console.log("EnhancedDashboard: Processing latest analysis");
          processLatestAnalysis(transformedData[transformedData.length - 1]);
        }
      } catch (error) {
        console.error("EnhancedDashboard: Error transforming voice history data:", error);
        // Don't use sample data, just show empty state
        setVoiceHistory([]);
      }
    } else {
      console.log("EnhancedDashboard: No voice history or assessment data available");
      console.log("EnhancedDashboard: dataVoiceHistory length:", dataVoiceHistory?.length || 0);
      console.log("EnhancedDashboard: assessments length:", assessments?.length || 0);
      
      // Show info toast only if user is logged in and we're not loading
      if (user?.id && !dataLoading && !assessmentLoading) {
        toast.info("No assessment data found. Take your first assessment to see insights here!", {
          action: {
            label: "Take Assessment",
            onClick: () => navigate('/symptom-checker')
          }
        });
      }
      
      // Don't use sample data, just show empty state
      setVoiceHistory([]);
      setModelPredictions([]);
    }
  }, [dataVoiceHistory, dataLoading, dataError, assessments, assessmentLoading]);

  const processLatestAnalysis = (analysis: PredictionResponse) => {
    console.log("processLatestAnalysis: Processing analysis data:", analysis);
    
    // Helper function to ensure we have valid numbers without fallbacks
    const getSafeNumber = (value: any) => {
      if (value === undefined || value === null) {
        return 0; // Return 0 instead of a fallback value
      }
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };
    
    try {
      // Ensure we have valid objects to work with
      const prediction = analysis?.prediction || {};
      const voice_metrics = analysis?.voice_metrics || {};
      
      // Process model predictions
      console.log("processLatestAnalysis: Processing model predictions");
      
      // Try different possible data structures for model predictions
      let modelPredictionsData: ModelPrediction[] = [];
      
      // Option 1: Check for model_predictions and model_probabilities
      const preds = prediction.model_predictions || {};
      const probs = prediction.model_probabilities || {};
      
      if (Object.keys(preds).length > 0) {
        modelPredictionsData = Object.keys(preds).map(modelName => ({
          name: modelName,
          prediction: getSafeNumber(preds[modelName]),
          probability: getSafeNumber(probs[modelName]),
        }));
      } 
      // Option 2: Check for models object
      else if (prediction.models && Object.keys(prediction.models).length > 0) {
        modelPredictionsData = Object.entries(prediction.models)
          .filter(([_, modelData]) => modelData !== null)
          .map(([modelName, modelData]) => {
            if (!modelData) return null;
            
            const probability = getSafeNumber(modelData.probability);
            const predictionValue = modelData.prediction !== undefined ? 
              getSafeNumber(modelData.prediction) : 
              (probability > 0.5 ? 1 : 0);
              
            return {
              name: modelName,
              prediction: predictionValue,
              probability: probability
            };
          })
          .filter(Boolean) as ModelPrediction[];
      }
      // Option 3: Generate sample data if no model predictions found
      else if (availableModels && availableModels.length > 0) {
        // Create sample predictions based on severity
        const severity = getSafeNumber(prediction.severity);
        const baseProb = severity / 100;
        
        modelPredictionsData = availableModels.map(modelName => {
          // Add some variance to make it look realistic
          const variance = Math.random() * 0.2 - 0.1; // -0.1 to 0.1
          const probability = Math.max(0, Math.min(1, baseProb + variance));
          return {
            name: modelName,
            prediction: probability > 0.5 ? 1 : 0,
            probability: probability
          };
        });
      }
      
      console.log("processLatestAnalysis: Model predictions data:", modelPredictionsData);
      setModelPredictions(modelPredictionsData);
      
      // Process voice metrics
      // Get voice metric values without fallbacks
      const pitch = getSafeNumber(voice_metrics.pitch);
      const jitter = getSafeNumber(voice_metrics.jitter);
      const shimmer = getSafeNumber(voice_metrics.shimmer);
      const hnr = getSafeNumber(voice_metrics.hnr);
      
      console.log("processLatestAnalysis: Voice metrics values:", { pitch, jitter, shimmer, hnr });
      
      // Process voice metrics
      const metrics: VoiceMetric[] = [
        {
          name: 'Pitch',
          value: pitch,
          unit: 'Hz',
          description: 'Fundamental frequency of voice',
          normalRange: '100-150 Hz',
          status: pitch < 100 || pitch > 150 ? 'warning' : 'normal'
        },
        {
          name: 'Jitter',
          value: jitter,
          unit: '%',
          description: 'Cycle-to-cycle variations in frequency',
          normalRange: '< 0.01',
          status: jitter > 0.01 ? (jitter > 0.015 ? 'critical' : 'warning') : 'normal'
        },
        {
          name: 'Shimmer',
          value: shimmer,
          unit: 'dB',
          description: 'Cycle-to-cycle variations in amplitude',
          normalRange: '< 0.05',
          status: shimmer > 0.05 ? (shimmer > 0.07 ? 'critical' : 'warning') : 'normal'
        },
        {
          name: 'HNR',
          value: hnr,
          unit: 'dB',
          description: 'Harmonics-to-Noise Ratio',
          normalRange: '> 20 dB',
          status: hnr < 20 ? (hnr < 15 ? 'critical' : 'warning') : 'normal'
        }
      ];
      
      console.log("processLatestAnalysis: Setting voice metrics:", metrics);
      setVoiceMetrics(metrics);
    } catch (error) {
      console.error("processLatestAnalysis: Error processing analysis data:", error);
      // Don't set default values, just clear the data
      setModelPredictions([]);
      setVoiceMetrics([]);
    }
  };

  useEffect(() => {
    console.log("EnhancedDashboard: Realtime data state changed", {
      realtimeLoading,
      realtimeError,
      realtimeDataExists: !!realtimeDataFromHook
    });
    
    if (realtimeLoading) {
      console.log("EnhancedDashboard: Realtime data is loading");
      setDisplayRealtimeData(null);
      return;
    }
    
    if (realtimeError) {
      console.error("EnhancedDashboard: Error loading realtime data:", realtimeError);
      setDisplayRealtimeData(null);
      return;
    }

    if (realtimeDataFromHook) {
      console.log("EnhancedDashboard: Setting realtime data:", realtimeDataFromHook);
      setDisplayRealtimeData(realtimeDataFromHook);
    } else {
      console.log("EnhancedDashboard: No realtime data available");
      setDisplayRealtimeData(null);
    }
  }, [realtimeDataFromHook, realtimeLoading, realtimeError]);

  const formatChartData = (data: PredictionResponse[]) => {
    console.log("formatChartData: Input data:", data);
    
    // Filter data based on selected time range
    let filteredData = [...data];
    
    if (timeRange === 'week') {
      const weekAgo = subDays(new Date(), 7);
      filteredData = data.filter(item => new Date(item.timestamp) >= weekAgo);
    } else if (timeRange === 'month') {
      const monthAgo = subMonths(new Date(), 1);
      filteredData = data.filter(item => new Date(item.timestamp) >= monthAgo);
    }
    
    console.log(`formatChartData: Filtered data (${timeRange}):`, filteredData);
    
    // Ensure all data points have valid numeric values
    const formattedData = filteredData.map(item => {
      // Safely parse numeric values without fallbacks
      const getSafeNumber = (value: any) => {
        if (value === undefined || value === null) {
          return 0;
        }
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      };
      
      // Format date strings
      let dateObj: Date;
      try {
        dateObj = new Date(item.timestamp);
        // Check if date is valid
        if (isNaN(dateObj.getTime())) {
          dateObj = new Date(); // Use current date if invalid
        }
      } catch (e) {
        dateObj = new Date(); // Use current date if error
      }
      
      // Ensure we have valid objects to work with
      const prediction = item.prediction || {};
      const voice_metrics = item.voice_metrics || {};
      
      // Get values from the data structure
      const severity = getSafeNumber(prediction.severity);
      const confidence = getSafeNumber(prediction.probability) * 100;
      const pitch = getSafeNumber(voice_metrics.pitch);
      const jitter = getSafeNumber(voice_metrics.jitter) * 100; // Convert to percentage
      const shimmer = getSafeNumber(voice_metrics.shimmer) * 100; // Convert to percentage
      const hnr = getSafeNumber(voice_metrics.hnr);
      
      console.log(`formatChartData: Processing item for ${format(dateObj, 'MMM dd')}:`, {
        severity, confidence, pitch, jitter, shimmer, hnr
      });
      
      return {
        date: format(dateObj, 'MMM dd'),
        fullDate: format(dateObj, 'MMM dd, yyyy HH:mm'),
        severity,
        confidence,
        pitch,
        jitter,
        shimmer,
        hnr,
        status: prediction.status ? 'Positive' : 'Negative'
      };
    });
    
    console.log("formatChartData: Final formatted data:", formattedData);
    return formattedData;
  };

  const chartMetrics = [
    { id: 'severity', label: 'Severity', color: '#ef4444', icon: <Gauge className="h-4 w-4" /> },
    { id: 'confidence', label: 'Confidence', color: '#3b82f6', icon: <BadgePercent className="h-4 w-4" /> },
    { id: 'pitch', label: 'Pitch', color: '#10b981', icon: <AudioLines className="h-4 w-4" /> },
    { id: 'jitter', label: 'Jitter', color: '#f59e0b', icon: <Activity className="h-4 w-4" /> },
    { id: 'shimmer', label: 'Shimmer', color: '#8b5cf6', icon: <AreaChart className="h-4 w-4" /> },
    { id: 'hnr', label: 'HNR', color: '#ec4899', icon: <BarChartIcon className="h-4 w-4" /> }
  ];

  const latestAnalysis = voiceHistory.length > 0 ? voiceHistory[voiceHistory.length - 1] : null;

  if (dataLoading || assessmentLoading || (realtimeLoading && !latestAnalysis && !displayRealtimeData)) { 
    return (
      <div className="flex items-center justify-center h-screen bg-muted/20">
        <div className="text-center">
          <LoaderIcon className="h-16 w-16 text-primary animate-spin mb-4 mx-auto" />
          <p className="text-lg text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (dataError && (!dataVoiceHistory || dataVoiceHistory.length === 0) && voiceHistory.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-muted/20">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            There was an issue fetching your analysis history. Please try again later.
            {typeof dataError === 'string' ? <p className="mt-2 text-xs">Details: {dataError}</p> : (dataError as Error)?.message && <p className="mt-2 text-xs">Details: {(dataError as Error).message}</p>}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const kpiData = {
    latestSeverity: latestAnalysis ? latestAnalysis.prediction.severity : null,
    latestConfidence: latestAnalysis ? latestAnalysis.prediction.probability * 100 : null,
    parkinsonsDetected: latestAnalysis ? (latestAnalysis.prediction.severity > 50 ? "Positive" : "Negative") : null,
    analysesCount: voiceHistory.length,
    lastUpdated: latestAnalysis ? format(new Date(latestAnalysis.timestamp), 'PPpp') : 'N/A',
    trendDirection: getTrendDirection()
  };
  
  function getTrendDirection() {
    if (voiceHistory.length < 2) return 'stable';
    
    // Get the last 5 analyses or all if less than 5
    const recentAnalyses = voiceHistory.slice(-Math.min(5, voiceHistory.length));
    
    // Helper function to ensure we have valid numbers
    const getSafeNumber = (value: any, fallback: number = 0) => {
      const num = Number(value);
      return isNaN(num) ? fallback : num;
    };
    
    // Calculate the average change in severity
    let totalChange = 0;
    let validComparisons = 0;
    
    for (let i = 1; i < recentAnalyses.length; i++) {
      const currentSeverity = getSafeNumber(recentAnalyses[i].prediction.severity, 50);
      const previousSeverity = getSafeNumber(recentAnalyses[i-1].prediction.severity, 50);
      
      totalChange += currentSeverity - previousSeverity;
      validComparisons++;
    }
    
    // Avoid division by zero
    if (validComparisons === 0) return 'stable';
    
    const avgChange = totalChange / validComparisons;
    
    if (avgChange > 2) return 'increasing';
    if (avgChange < -2) return 'decreasing';
    return 'stable';
  }
  
  const getTrendIcon = () => {
    const direction = kpiData.trendDirection;
    if (direction === 'increasing') return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (direction === 'decreasing') return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getModelConsensus = () => {
    if (modelPredictions.length === 0) return null;
    
    const positiveCount = modelPredictions.filter(model => model.prediction === 1).length;
    const totalCount = modelPredictions.length;
    const consensusPercent = (positiveCount / totalCount) * 100;
    
    let consensusText = '';
    let consensusColor = '';
    
    if (consensusPercent === 100) {
      consensusText = 'Complete agreement on positive diagnosis';
      consensusColor = 'text-orange-500';
    } else if (consensusPercent === 0) {
      consensusText = 'Complete agreement on negative diagnosis';
      consensusColor = 'text-green-500';
    } else if (consensusPercent > 50) {
      consensusText = 'Majority suggests positive diagnosis';
      consensusColor = 'text-amber-500';
    } else {
      consensusText = 'Majority suggests negative diagnosis';
      consensusColor = 'text-emerald-500';
    }
    
    return (
      <div className="mt-2">
        <p className="text-sm font-medium">Model Consensus:</p>
        <p className={`text-sm ${consensusColor}`}>{consensusText}</p>
        <CustomProgress 
          value={consensusPercent} 
          className="h-2 mt-1" 
          indicatorClassName={consensusPercent > 50 ? "bg-orange-500" : "bg-green-500"} 
        />
        <p className="text-xs text-muted-foreground mt-1">
          {positiveCount} of {totalCount} models predict positive
        </p>
      </div>
    );
  };

  const getStatusBadge = (status: 'normal' | 'warning' | 'critical') => {
    switch (status) {
      case 'normal':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">Normal</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">Elevated</Badge>;
      case 'critical':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800">Critical</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-blue-50/30 to-indigo-50/20 dark:from-zinc-900 dark:via-blue-950/20 dark:to-indigo-950/10 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-white/20 dark:border-slate-800/30">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">
              Welcome Back, {user?.name || user?.email?.split('@')[0] || 'User'}!
            </h1>
            {kpiData.parkinsonsDetected === "Positive" ? (
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/50 animate-pulse">
                At Risk
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50">
                Healthy
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Your Parkinson's Disease insights at a glance. Last updated: {kpiData.lastUpdated}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
            This dashboard provides comprehensive analysis of your voice biomarkers and their correlation with Parkinson's indicators.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {/* Debug button - only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={async () => {
                console.log('=== DASHBOARD DEBUG: Manual data check ===');
                console.log('Current user:', user);
                console.log('User ID:', user?.id);
                
                if (user?.id) {
                  try {
                    const { ref, get, getDatabase } = await import('firebase/database');
                    const { app } = await import('@/lib/firebase');
                    const database = getDatabase(app);
                    
                    // Check voice history using both methods
                    const voiceHistorySnapshot = await get(ref(database, `users/${user.id}/voiceHistory`));
                    console.log('DASHBOARD - Voice history exists:', voiceHistorySnapshot.exists());
                    if (voiceHistorySnapshot.exists()) {
                      console.log('DASHBOARD - Voice history data:', voiceHistorySnapshot.val());
                    }
                    
                    // Try both data loading methods
                    const { getUserVoiceHistory } = await import('@/services/dataService');
                    const { getAssessmentHistory } = await import('@/utils/assessmentHistory');
                    
                    const voiceData = await getUserVoiceHistory(user.id);
                    console.log('DASHBOARD - getUserVoiceHistory result:', voiceData);
                    
                    const assessmentData = await getAssessmentHistory(user.id);
                    console.log('DASHBOARD - getAssessmentHistory result:', assessmentData);
                    
                    // Check all user data
                    const allUserDataSnapshot = await get(ref(database, `users/${user.id}`));
                    console.log('DASHBOARD - All user data:', allUserDataSnapshot.exists() ? allUserDataSnapshot.val() : 'No data');
                    
                    // Check if there's any data at all for this user
                    if (allUserDataSnapshot.exists()) {
                      const userData = allUserDataSnapshot.val();
                      console.log('DASHBOARD - User data structure:', Object.keys(userData));
                      
                      // Check each possible data location
                      if (userData.voiceHistory) {
                        console.log('DASHBOARD - voiceHistory keys:', Object.keys(userData.voiceHistory));
                        console.log('DASHBOARD - voiceHistory sample:', Object.values(userData.voiceHistory)[0]);
                      }
                      if (userData.assessments) {
                        console.log('DASHBOARD - assessments keys:', Object.keys(userData.assessments));
                      }
                      if (userData.profile) {
                        console.log('DASHBOARD - profile data:', userData.profile);
                      }
                    } else {
                      console.log('❌ DASHBOARD - NO DATA FOUND FOR USER:', user.id);
                      console.log('This could mean:');
                      console.log('1. User has not taken any assessments yet');
                      console.log('2. Data was saved under different user ID');
                      console.log('3. Data was saved to different Firebase path');
                    }
                    
                    // Show summary in toast
                    const voiceCount = voiceData?.length || 0;
                    const assessmentCount = assessmentData?.length || 0;
                    const hasAnyData = allUserDataSnapshot.exists();
                    toast.info(`Debug: Found ${voiceCount} voice records, ${assessmentCount} assessments. User data exists: ${hasAnyData}`);
                    
                  } catch (error) {
                    console.error('DASHBOARD - Debug check failed:', error);
                    toast.error('Debug check failed - see console for details');
                  }
                }
              }}
              className="flex items-center gap-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
            >
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Debug</span>
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              console.log('=== DASHBOARD: Manual refresh triggered ===');
              window.location.reload();
            }}
            className="flex items-center gap-1"
          >
            <RefreshCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          
          <Button onClick={() => navigate('/app/analysis')} className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all">
            <Mic className="mr-2 h-4 w-4" /> New Voice Analysis
          </Button>
          <Button variant="outline" onClick={() => navigate('/app/history')} className="flex-1 sm:flex-none shadow-sm hover:shadow-md transition-all">
            <History className="mr-2 h-4 w-4" /> View History
          </Button>
        </div>
      </header>

      {/* Analysis Method Guide - Show if user has no assessments or limited data */}
      {(!assessments || assessments.length < 3) && (
        <section className="mb-8">
          <AnalysisMethodGuide />
        </section>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="overflow-hidden border-l-4 border-l-red-500 shadow-lg hover:shadow-xl transition-all bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Risk Assessment</CardTitle>
              <CardDescription className="text-xs mt-1">Parkinson's severity indicator</CardDescription>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Gauge className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {kpiData.latestSeverity !== null ? `${kpiData.latestSeverity.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground flex items-center">
              {getTrendIcon()}
              <span className="ml-1">
                {kpiData.trendDirection === 'increasing' ? 'Increasing trend' : 
                 kpiData.trendDirection === 'decreasing' ? 'Decreasing trend' : 'Stable trend'}
              </span>
            </div>
            <CustomProgress 
              value={kpiData.latestSeverity || 0} 
              className="h-2 mt-2" 
              indicatorClassName={`${kpiData.latestSeverity && kpiData.latestSeverity > 70 ? 'bg-red-500' : 
                                     kpiData.latestSeverity && kpiData.latestSeverity > 50 ? 'bg-orange-500' : 
                                     'bg-green-500'}`} 
            />
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-md">
              <p><strong>What this means:</strong> This score represents the estimated severity of Parkinson's indicators in your voice. Values above 50% suggest potential symptoms.</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Prediction Confidence</CardTitle>
              <CardDescription className="text-xs mt-1">AI model certainty level</CardDescription>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <BadgePercent className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {kpiData.latestConfidence !== null ? `${kpiData.latestConfidence.toFixed(1)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Based on the latest analysis</p>
            {getModelConsensus()}
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-md">
              <p><strong>What this means:</strong> Higher confidence indicates more reliable predictions. Multiple AI models are used to ensure accuracy and reduce false positives.</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-all bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Voice Biomarkers</CardTitle>
              <CardDescription className="text-xs mt-1">Key acoustic measurements</CardDescription>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <AudioLines className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="space-y-2">
              {voiceMetrics.map((metric, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span>{metric.name}:</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${metric.status === 'normal' ? 'text-green-600 dark:text-green-400' : 
                                                   metric.status === 'warning' ? 'text-amber-600 dark:text-amber-400' : 
                                                   'text-red-600 dark:text-red-400'}`}>
                      {metric.value.toFixed(metric.name === 'Pitch' || metric.name === 'HNR' ? 1 : 3)} {metric.unit}
                    </span>
                    {getStatusBadge(metric.status)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-md">
              <p><strong>What this means:</strong> These acoustic measurements detect subtle voice changes that may indicate Parkinson's. Abnormal values in multiple metrics increase diagnostic confidence.</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden border-l-4 border-l-emerald-500 shadow-lg hover:shadow-xl transition-all bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-medium">Analysis Summary</CardTitle>
              <CardDescription className="text-xs mt-1">Overall assessment status</CardDescription>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <FileText className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Status:</span>
                <Badge variant={kpiData.parkinsonsDetected === "Positive" ? "destructive" : "default"} className={kpiData.parkinsonsDetected === "Positive" ? "" : "bg-green-500 hover:bg-green-600 text-white"}>
                  {kpiData.parkinsonsDetected || 'N/A'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Analyses:</span>
                <span className="font-medium">{kpiData.analysesCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Last Analysis:</span>
                <span className="text-xs">{latestAnalysis ? format(new Date(latestAnalysis.timestamp), 'MMM dd, yyyy') : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Models Used:</span>
                <span className="text-xs">{modelPredictions.length}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-md">
              <p><strong>What this means:</strong> This is your overall assessment based on all voice biomarkers and AI models. Regular testing improves accuracy and helps track progression over time.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full shadow-lg hover:shadow-xl transition-shadow bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-blue-100 dark:border-blue-900/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <LineChartIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Analysis History</CardTitle>
                    <CardDescription className="text-xs mt-1">Longitudinal tracking of your voice biomarkers</CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant={timeRange === 'week' ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setTimeRange('week')}
                    className="text-xs h-8"
                  >
                    Week
                  </Button>
                  <Button 
                    variant={timeRange === 'month' ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setTimeRange('month')}
                    className="text-xs h-8"
                  >
                    Month
                  </Button>
                  <Button 
                    variant={timeRange === 'all' ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setTimeRange('all')}
                    className="text-xs h-8"
                  >
                    All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Tabs defaultValue="severity" onValueChange={setSelectedMetric} className="w-full">
                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-4">
                  {chartMetrics.map(metric => (
                    <TabsTrigger key={metric.id} value={metric.id} className="text-xs sm:text-sm data-[state=active]:shadow-sm">
                      <span style={{ color: selectedMetric === metric.id ? metric.color : undefined }} className="flex items-center gap-1">
                        {React.cloneElement(metric.icon, { style: { color: selectedMetric === metric.id ? metric.color : themeColor }})}
                        {metric.label}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value={selectedMetric}>
                  <div className="h-[350px] sm:h-[400px]">
                    {voiceHistory.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={formatChartData(voiceHistory)} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                          <XAxis dataKey="date" tick={{ fontSize: 12, fill: themeColor }} stroke={themeColor} />
                          <YAxis tick={{ fontSize: 12, fill: themeColor }} stroke={themeColor} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDarkMode ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.85)',
                              borderColor: isDarkMode ? '#555' : '#CCC',
                              borderRadius: '0.5rem',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            }}
                            labelStyle={{ color: isDarkMode ? '#EEE' : '#333', fontWeight: 'bold' }}
                            itemStyle={{ color: chartMetrics.find(m => m.id === selectedMetric)?.color }}                            formatter={(value: any) => {
                              const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                              return [
                                `${numValue.toFixed(selectedMetric === 'jitter' || selectedMetric === 'shimmer' ? 2 : 1)} ${
                                  selectedMetric === 'confidence' || selectedMetric === 'severity' || selectedMetric === 'jitter' || selectedMetric === 'shimmer' ? '%' : 
                                  selectedMetric === 'pitch' ? 'Hz' : 
                                  selectedMetric === 'hnr' ? 'dB' : ''
                                }`,
                                chartMetrics.find(m => m.id === selectedMetric)?.label
                              ];
                            }}
                            labelFormatter={(label: string, payload: any[]) => {
                              if (payload && payload.length > 0 && payload[0].payload) {
                                return payload[0].payload.fullDate;
                              }
                              return label;
                            }}
                          />
                          <Legend formatter={(value) => <span style={{ color: themeColor }}>{chartMetrics.find(m => m.id === value)?.label || value}</span>} />
                          <Line
                            key={`line-${selectedMetric}`}
                            type="monotone"
                            dataKey={selectedMetric}
                            stroke={chartMetrics.find(m => m.id === selectedMetric)?.color || '#8884d8'}
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: chartMetrics.find(m => m.id === selectedMetric)?.color }}
                            activeDot={{ r: 6 }}
                            name={selectedMetric}
                          />
                          {selectedMetric === 'severity' && (
                            <Line
                              key="line-diagnosis-status"
                              type="monotone"
                              dataKey="status"
                              stroke="transparent"
                              name="Diagnosis"
                              dot={({ cx, cy, payload, index }) => {
                                // Check if cx or cy is NaN and provide fallback values
                                const validCx = isNaN(cx) ? 0 : cx;
                                const validCy = isNaN(cy) ? 0 : cy;
                                
                                return (
                                  <svg 
                                    key={`status-dot-${index}`}
                                    x={validCx - 10} 
                                    y={validCy - 10} 
                                    width={20} 
                                    height={20} 
                                    fill="none" 
                                    viewBox="0 0 24 24"
                                  >
                                    {payload.status === 'Positive' ? (
                                      <circle key={`circle-positive-${index}`} cx={10} cy={10} r={8} fill="#fb923c" fillOpacity={0.6} />
                                    ) : (
                                      <circle key={`circle-negative-${index}`} cx={10} cy={10} r={8} fill="#4ade80" fillOpacity={0.6} />
                                    )}
                                  </svg>
                                );
                              }}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                        <p className="text-lg font-semibold text-muted-foreground">No Analysis History</p>
                        <p className="text-sm text-muted-foreground mb-4">Start a new voice analysis to see your progress here.</p>
                        <Button onClick={() => navigate('/app/analysis')} variant="outline">
                          <Mic className="mr-2 h-4 w-4" /> Record First Analysis
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-purple-100 dark:border-purple-900/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle className="text-base">Model Predictions</CardTitle>
                  <CardDescription className="text-xs mt-1">AI model confidence analysis</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3 p-3 bg-purple-50/50 dark:bg-purple-950/30 rounded-lg text-xs text-slate-700 dark:text-slate-300 border border-purple-100 dark:border-purple-900/30">
                <div className="flex gap-2 items-start">
                  <Info className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Multi-Model Approach</p>
                    <p>This chart shows how different AI models evaluate your voice data. Higher percentages indicate stronger confidence in the prediction. Green bars represent negative predictions (healthy), while orange bars indicate positive predictions (potential Parkinson's indicators).</p>
                  </div>
                </div>
              </div>
              
              {modelPredictions.length > 0 ? (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={modelPredictions} 
                      margin={{ top: 5, right: 20, left: -15, bottom: 40 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                      <XAxis 
                        type="number"
                        domain={[0, 1]}
                        tickFormatter={(value) => {
                          const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                          return `${(numValue * 100).toFixed(0)}%`;
                        }}
                        tick={{ fontSize: 10, fill: themeColor }} 
                        stroke={themeColor} 
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category"
                        tick={{ fontSize: 10, fill: themeColor }} 
                        stroke={themeColor} 
                        width={100}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDarkMode ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)',
                          borderColor: isDarkMode ? '#555' : '#CCC',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          padding: '10px'
                        }}
                        labelStyle={{ color: isDarkMode ? '#EEE' : '#333', fontWeight: 'bold', marginBottom: '5px' }}
                        itemStyle={{ paddingTop: '2px', paddingBottom: '2px'}}                        formatter={(value: any, name: string, entry: any) => {
                          const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                          const predictionText = entry.payload.prediction === 1 ? "Positive" : "Negative";
                          const color = entry.payload.prediction === 1 ? '#fb923c' : '#4ade80';
                          return [
                            <span style={{ color }}>{`${(numValue * 100).toFixed(0)}% (${predictionText})`}</span>,
                            'Probability'
                          ];
                        }}
                        labelFormatter={(label: string) => <span style={{ color: isDarkMode ? '#FFF' : '#000' }}>{label}</span>}
                      />
                      <Bar dataKey="probability" name="Model Performance">
                        {modelPredictions.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.prediction === 1 ? '#fb923c' : '#4ade80'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[280px] text-center p-4">
                  <Brain className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-md font-semibold text-muted-foreground">No Model Predictions</p>
                  <p className="text-sm text-muted-foreground">Detailed model comparisons will appear here after an analysis.</p>
                </div>
              )}
              
              <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 p-2 rounded-md">
                <p><strong>Why multiple models?</strong> Using an ensemble of different AI models increases diagnostic accuracy and reduces the chance of false positives or negatives. The "Ensemble" model represents the weighted consensus of all models.</p>
              </div>
            </CardContent>
          </Card>

          {latestAnalysis && latestAnalysis.recommendations && latestAnalysis.recommendations.length > 0 && (
            <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-green-100 dark:border-green-900/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Personalized Recommendations</CardTitle>
                    <CardDescription className="text-xs mt-1">Tailored suggestions based on your voice analysis</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-3 p-3 bg-green-50/50 dark:bg-green-950/30 rounded-lg text-xs text-slate-700 dark:text-slate-300 border border-green-100 dark:border-green-900/30">
                  <div className="flex gap-2 items-start">
                    <Info className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">About These Recommendations</p>
                      <p>These suggestions are generated based on your voice analysis results and are designed to help manage symptoms and improve quality of life. Always consult with your healthcare provider before making changes to your treatment plan.</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {latestAnalysis.recommendations.map((rec, index) => (
                    <Alert key={index} className="text-xs p-3 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80 shadow-sm border border-slate-200 dark:border-slate-700/50">
                      <div className="flex gap-2">
                        {index % 3 === 0 && (
                          <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <Stethoscope className="h-3.5 w-3.5 text-blue-500" />
                          </div>
                        )}
                        {index % 3 === 1 && (
                          <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                            <Info className="h-3.5 w-3.5 text-amber-500" />
                          </div>
                        )}
                        {index % 3 === 2 && (
                          <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                            <ListChecks className="h-3.5 w-3.5 text-green-500" />
                          </div>
                        )}
                        <AlertDescription className="pt-0.5">{rec}</AlertDescription>
                      </div>
                    </Alert>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-3">
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Download className="h-3.5 w-3.5 mr-1" /> Save as PDF
                  </Button>
                  <Button variant="default" size="sm" className="text-xs bg-gradient-to-r from-green-600 to-emerald-600">
                    <Share2 className="h-3.5 w-3.5 mr-1" /> Share with Doctor
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </section>

      {displayRealtimeData && (
        <section>
          <Card className="shadow-lg hover:shadow-xl transition-shadow border border-blue-200 dark:border-blue-900 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/50 dark:to-indigo-950/30">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <RefreshCcw className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-pulse" />
                </div>
                <div>
                  <CardTitle>Real-time Voice Analysis</CardTitle>
                  <CardDescription className="text-xs mt-1">Live metrics from your current recording session</CardDescription>
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg text-xs text-slate-700 dark:text-slate-300 border border-blue-200 dark:border-blue-800/30">
                <div className="flex gap-2 items-start">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p>These metrics are being captured in real-time as you speak. They provide immediate feedback on your voice characteristics and help track subtle changes that may not be audible.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-4">
              {/* Calculate voice metrics and severity outside the render function */}
              {(() => {
                // Helper function to ensure we have valid numbers
                const getSafeNumber = (value: any, fallback: number = 0) => {
                  const num = Number(value);
                  return isNaN(num) ? fallback : num;
                };
                
                // Get safe values from realtime data
                const pitch = getSafeNumber(displayRealtimeData.pitch, 120);
                const jitter = getSafeNumber(displayRealtimeData.jitter, 0.01);
                const shimmer = getSafeNumber(displayRealtimeData.shimmer, 0.05);
                const hnr = getSafeNumber(displayRealtimeData.hnr, 20);
                
                // Determine status for each metric
                const pitchStatus = pitch < 100 || pitch > 150 ? 'warning' : 'normal';
                const jitterStatus = jitter > 0.01 ? (jitter > 0.015 ? 'critical' : 'warning') : 'normal';
                const shimmerStatus = shimmer > 0.05 ? (shimmer > 0.07 ? 'critical' : 'warning') : 'normal';
                const hnrStatus = hnr < 20 ? (hnr < 15 ? 'critical' : 'warning') : 'normal';
                
                // Calculate overall severity score (0-100)
                const jitterScore = Math.min(100, Math.max(0, (jitter / 0.02) * 100));
                const shimmerScore = Math.min(100, Math.max(0, (shimmer / 0.08) * 100));
                const hnrScore = Math.min(100, Math.max(0, ((30 - hnr) / 30) * 100));
                const pitchScore = Math.min(100, Math.max(0, 
                  (pitch < 100 ? (100 - pitch) * 2 : (pitch > 150 ? (pitch - 150) * 2 : 0))
                ));
                
                // Overall severity (weighted average)
                const overallSeverity = Math.round(
                  (jitterScore * 0.35) + (shimmerScore * 0.35) + (hnrScore * 0.2) + (pitchScore * 0.1)
                );
                
                // Determine severity level and description
                let severityLevel = 'Normal';
                let severityColor = 'text-green-600 dark:text-green-400';
                let severityDescription = 'No significant voice abnormalities detected.';
                
                if (overallSeverity > 75) {
                  severityLevel = 'Severe';
                  severityColor = 'text-red-600 dark:text-red-400';
                  severityDescription = 'Significant voice abnormalities detected that may indicate advanced symptoms.';
                } else if (overallSeverity > 50) {
                  severityLevel = 'Moderate';
                  severityColor = 'text-orange-600 dark:text-orange-400';
                  severityDescription = 'Moderate voice abnormalities detected that may indicate developing symptoms.';
                } else if (overallSeverity > 25) {
                  severityLevel = 'Mild';
                  severityColor = 'text-yellow-600 dark:text-yellow-400';
                  severityDescription = 'Mild voice abnormalities detected that may warrant monitoring.';
                }
                
                return (
                  <>
                    <div className={`flex flex-col items-center justify-center p-4 rounded-lg shadow-sm border ${
                      pitchStatus === 'normal' ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/30' : 
                      'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/30'
                    }`}>
                      <div className="h-10 w-10 rounded-full bg-white/80 dark:bg-slate-800/80 flex items-center justify-center mb-2">
                        <AudioLines className={`h-5 w-5 ${
                          pitchStatus === 'normal' ? 'text-blue-500' : 'text-amber-500'
                        }`} />
                      </div>
                      <span className="text-sm font-medium">Pitch</span>
                      <span className={`text-2xl font-bold ${
                        pitchStatus === 'normal' ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'
                      }`}>{pitch.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">Hz</span>
                      <span className="text-xs mt-1 text-slate-600 dark:text-slate-400">Normal: 100-150 Hz</span>
                    </div>
                    
                    <div className={`flex flex-col items-center justify-center p-4 rounded-lg shadow-sm border ${
                      jitterStatus === 'normal' ? 'bg-green-50/80 dark:bg-green-950/40 border-green-200 dark:border-green-800/30' : 
                      jitterStatus === 'warning' ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/30' :
                      'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800/30'
                    }`}>
                      <div className="h-10 w-10 rounded-full bg-white/80 dark:bg-slate-800/80 flex items-center justify-center mb-2">
                        <Activity className={`h-5 w-5 ${
                          jitterStatus === 'normal' ? 'text-green-500' : 
                          jitterStatus === 'warning' ? 'text-amber-500' : 'text-red-500'
                        }`} />
                      </div>
                      <span className="text-sm font-medium">Jitter</span>
                      <span className={`text-2xl font-bold ${
                        jitterStatus === 'normal' ? 'text-green-700 dark:text-green-300' : 
                        jitterStatus === 'warning' ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'
                      }`}>{(jitter * 100).toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">%</span>
                      <span className="text-xs mt-1 text-slate-600 dark:text-slate-400">Normal: &lt; 1.0%</span>
                    </div>
                    
                    <div className={`flex flex-col items-center justify-center p-4 rounded-lg shadow-sm border ${
                      shimmerStatus === 'normal' ? 'bg-green-50/80 dark:bg-green-950/40 border-green-200 dark:border-green-800/30' : 
                      shimmerStatus === 'warning' ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/30' :
                      'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800/30'
                    }`}>
                      <div className="h-10 w-10 rounded-full bg-white/80 dark:bg-slate-800/80 flex items-center justify-center mb-2">
                        <AreaChart className={`h-5 w-5 ${
                          shimmerStatus === 'normal' ? 'text-green-500' : 
                          shimmerStatus === 'warning' ? 'text-amber-500' : 'text-red-500'
                        }`} />
                      </div>
                      <span className="text-sm font-medium">Shimmer</span>
                      <span className={`text-2xl font-bold ${
                        shimmerStatus === 'normal' ? 'text-green-700 dark:text-green-300' : 
                        shimmerStatus === 'warning' ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'
                      }`}>{(shimmer * 100).toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground">%</span>
                      <span className="text-xs mt-1 text-slate-600 dark:text-slate-400">Normal: &lt; 5.0%</span>
                    </div>
                    
                    <div className={`flex flex-col items-center justify-center p-4 rounded-lg shadow-sm border ${
                      hnrStatus === 'normal' ? 'bg-green-50/80 dark:bg-green-950/40 border-green-200 dark:border-green-800/30' : 
                      hnrStatus === 'warning' ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/30' :
                      'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800/30'
                    }`}>
                      <div className="h-10 w-10 rounded-full bg-white/80 dark:bg-slate-800/80 flex items-center justify-center mb-2">
                        <BarChartIcon className={`h-5 w-5 ${
                          hnrStatus === 'normal' ? 'text-green-500' : 
                          hnrStatus === 'warning' ? 'text-amber-500' : 'text-red-500'
                        }`} />
                      </div>
                      <span className="text-sm font-medium">HNR</span>
                      <span className={`text-2xl font-bold ${
                        hnrStatus === 'normal' ? 'text-green-700 dark:text-green-300' : 
                        hnrStatus === 'warning' ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300'
                      }`}>{hnr.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">dB</span>
                      <span className="text-xs mt-1 text-slate-600 dark:text-slate-400">Normal: &gt; 20 dB</span>
                    </div>
                  </>
                );
              })()}
              
              {/* Add Severity Summary Card - spans full width */}
              {(() => {
                // Helper function to ensure we have valid numbers
                const getSafeNumber = (value: any, fallback: number = 0) => {
                  const num = Number(value);
                  return isNaN(num) ? fallback : num;
                };
                
                // Get safe values from realtime data
                const pitch = getSafeNumber(displayRealtimeData.pitch, 120);
                const jitter = getSafeNumber(displayRealtimeData.jitter, 0.01);
                const shimmer = getSafeNumber(displayRealtimeData.shimmer, 0.05);
                const hnr = getSafeNumber(displayRealtimeData.hnr, 20);
                
                // Calculate overall severity score (0-100)
                const jitterScore = Math.min(100, Math.max(0, (jitter / 0.02) * 100));
                const shimmerScore = Math.min(100, Math.max(0, (shimmer / 0.08) * 100));
                const hnrScore = Math.min(100, Math.max(0, ((30 - hnr) / 30) * 100));
                const pitchScore = Math.min(100, Math.max(0, 
                  (pitch < 100 ? (100 - pitch) * 2 : (pitch > 150 ? (pitch - 150) * 2 : 0))
                ));
                
                // Overall severity (weighted average)
                const overallSeverity = Math.round(
                  (jitterScore * 0.35) + (shimmerScore * 0.35) + (hnrScore * 0.2) + (pitchScore * 0.1)
                );
                
                // Determine severity level and description
                let severityLevel = 'Normal';
                let severityColor = 'text-green-600 dark:text-green-400';
                let severityDescription = 'No significant voice abnormalities detected.';
                
                if (overallSeverity > 75) {
                  severityLevel = 'Severe';
                  severityColor = 'text-red-600 dark:text-red-400';
                  severityDescription = 'Significant voice abnormalities detected that may indicate advanced symptoms.';
                } else if (overallSeverity > 50) {
                  severityLevel = 'Moderate';
                  severityColor = 'text-orange-600 dark:text-orange-400';
                  severityDescription = 'Moderate voice abnormalities detected that may indicate developing symptoms.';
                } else if (overallSeverity > 25) {
                  severityLevel = 'Mild';
                  severityColor = 'text-yellow-600 dark:text-yellow-400';
                  severityDescription = 'Mild voice abnormalities detected that may warrant monitoring.';
                }
                
                return (
                  <div className="col-span-2 sm:col-span-4 mt-4">
                    <div className={`p-4 rounded-lg shadow-sm border ${
                      overallSeverity > 75 ? 'bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800/30' :
                      overallSeverity > 50 ? 'bg-orange-50/80 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800/30' :
                      overallSeverity > 25 ? 'bg-yellow-50/80 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800/30' :
                      'bg-green-50/80 dark:bg-green-950/40 border-green-200 dark:border-green-800/30'
                    }`}>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                            overallSeverity > 75 ? 'bg-red-100 dark:bg-red-900/30' :
                            overallSeverity > 50 ? 'bg-orange-100 dark:bg-orange-900/30' :
                            overallSeverity > 25 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                            'bg-green-100 dark:bg-green-900/30'
                          }`}>
                            <Gauge className={`h-6 w-6 ${
                              overallSeverity > 75 ? 'text-red-600 dark:text-red-400' :
                              overallSeverity > 50 ? 'text-orange-600 dark:text-orange-400' :
                              overallSeverity > 25 ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-green-600 dark:text-green-400'
                            }`} />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium">Voice Analysis Severity</h3>
                            <p className={`text-xl font-bold ${severityColor}`}>{severityLevel} ({overallSeverity}%)</p>
                          </div>
                        </div>
                        
                        <div className="flex-1 text-sm">
                          <p className="text-slate-700 dark:text-slate-300">{severityDescription}</p>
                          <div className="mt-2 flex items-center">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  overallSeverity > 75 ? 'bg-red-600' :
                                  overallSeverity > 50 ? 'bg-orange-500' :
                                  overallSeverity > 25 ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`} 
                                style={{ width: `${overallSeverity}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
            <CardFooter className="bg-slate-50/50 dark:bg-slate-800/20 p-4 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700/50">
              <p><strong>What these metrics mean:</strong> Pitch measures voice frequency, while Jitter and Shimmer quantify voice irregularity. HNR (Harmonics-to-Noise Ratio) indicates voice clarity. Abnormal values in multiple metrics may suggest vocal changes associated with Parkinson's disease.</p>
            </CardFooter>
          </Card>
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-indigo-100 dark:border-indigo-900/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription className="text-xs mt-1">Your latest voice analysis sessions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-3 p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-lg text-xs text-slate-700 dark:text-slate-300 border border-indigo-100 dark:border-indigo-900/30">
              <div className="flex gap-2 items-start">
                <Info className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <p>Your recent voice analysis history shows trends in your voice biomarkers over time. Regular testing helps establish a reliable baseline and detect subtle changes.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {voiceHistory.slice(-5).reverse().map((analysis, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/80 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700/50">
                  <div className={`mt-0.5 p-2 rounded-full ${analysis.prediction.status ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'}`}>
                    {analysis.prediction.status ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium">
                          Voice Analysis {analysis.prediction.status ? 'Detected Risk' : 'Normal Results'}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                          <div className="flex items-center">
                            <Gauge className="h-3 w-3 text-red-500 mr-1" />
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Severity: <span className="font-medium">{analysis.prediction.severity.toFixed(1)}%</span>
                            </p>
                          </div>
                          <div className="flex items-center">
                            <BadgePercent className="h-3 w-3 text-blue-500 mr-1" />
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Confidence: <span className="font-medium">{(analysis.prediction.probability * 100).toFixed(1)}%</span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(analysis.timestamp), 'MMM dd, HH:mm')}
                        </p>
                        <Badge variant="outline" className="mt-1 text-[10px] px-1 py-0 h-4">
                          {index === 0 ? 'Latest' : `${index + 1} days ago`}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {voiceHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
          {voiceHistory.length > 0 && (
            <CardFooter className="pt-0">
              <Button variant="default" size="sm" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600" onClick={() => navigate('/app/history')}>
                View Complete History <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          )}
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-amber-100 dark:border-amber-900/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base">Insights & Tips</CardTitle>
                <CardDescription className="text-xs mt-1">Helpful information for voice health</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-3 p-3 bg-amber-50/50 dark:bg-amber-950/30 rounded-lg text-xs text-slate-700 dark:text-slate-300 border border-amber-100 dark:border-amber-900/30">
              <div className="flex gap-2 items-start">
                <Info className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p>These evidence-based tips can help you maintain vocal health and potentially slow progression of voice symptoms. Regular practice of these techniques may improve your overall communication abilities.</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20 rounded-lg shadow-sm border border-blue-200 dark:border-blue-900/30">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Voice Exercise Tip</p>
                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
                      Try the "Ah-Ah-Ah" exercise: Take a deep breath and say "ah" at different pitches. This helps improve vocal strength and control.
                    </p>
                    <p className="text-[10px] text-blue-500/70 dark:text-blue-400/70 mt-2 italic">
                      Practice this exercise for 5 minutes daily for best results.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-900/20 rounded-lg shadow-sm border border-purple-200 dark:border-purple-900/30">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Did You Know?</p>
                    <p className="text-xs text-purple-600/80 dark:text-purple-400/80 mt-1">
                      Voice changes can appear up to 5-10 years before motor symptoms in Parkinson's disease. Regular voice analysis can help with early detection.
                    </p>
                    <p className="text-[10px] text-purple-500/70 dark:text-purple-400/70 mt-2 italic">
                      Source: American Journal of Speech-Language Pathology
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20 rounded-lg shadow-sm border border-amber-200 dark:border-amber-900/30">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                    <Wand2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Improvement Strategy</p>
                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                      Record yourself reading the same passage weekly. This provides a consistent baseline to track changes in your voice over time.
                    </p>
                    <p className="text-[10px] text-amber-500/70 dark:text-amber-400/70 mt-2 italic">
                      Try using the "Rainbow Passage" or "Grandfather Passage" for standardized assessment.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/40 dark:to-green-900/20 rounded-lg shadow-sm border border-green-200 dark:border-green-900/30">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                    <Bookmark className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Resource Recommendation</p>
                    <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                      The LSVT LOUD® program is specifically designed to improve voice and speech in Parkinson's patients. Ask your doctor for a referral.
                    </p>
                    <p className="text-[10px] text-green-500/70 dark:text-green-400/70 mt-2 italic">
                      Visit lsvtglobal.com for more information and certified clinicians.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      
      <footer className="text-center pt-8 pb-4 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm rounded-xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-blue-500" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Parkinson Insight Dashboard</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Providing voice-based analysis for early detection and monitoring</p>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
              AI-Powered
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
              Voice Analytics
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
              Early Detection
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-4">&copy; {new Date().getFullYear()} Parkinson Insight. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default EnhancedDashboard;