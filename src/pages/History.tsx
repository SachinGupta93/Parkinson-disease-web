import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Assessment, getAssessmentHistory, clearAssessmentHistory } from '@/utils/assessmentHistory';
import { toast } from 'sonner';
import ProgressTracker from '@/components/ProgressTracker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ModelComparison from '@/components/ModelComparison';
import DatasetSummaryChart from '@/components/DatasetSummaryChart';
import SymptomTrendsChart from '@/components/SymptomTrendsChart';
import FeatureImportance from '@/components/FeatureImportance';
import VoiceAnalysisVisualizer from '@/components/VoiceAnalysisVisualizer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { UserContext } from '@/App';
import { 
  BarChart3, 
  Scale, 
  LineChart, 
  Calendar, 
  FileText, 
  ActivitySquare, 
  Star, 
  ClipboardList,
  AlertTriangle,
  ChevronRight,
  History as HistoryIcon,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart2,
  Mic,
  Database,
  ArrowLeft,
  Home,
  Download,
  Trash2,
  Info,
  Calendar as CalendarIcon,
  Clock,
  Gauge,
  Brain,
  BarChart4,
  Filter,
  Activity,
  CheckCircle,
  X
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const History = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoading(true);
        console.log('History - Loading assessment history for user:', user);
        console.log('History - User ID:', user?.id);
        
        // Debug: Check if there's any data in Firebase for this user
        if (user?.id) {
          try {
            const { ref, get, getDatabase } = await import('firebase/database');
            const { app } = await import('@/lib/firebase');
            const database = getDatabase(app);
            const snapshot = await get(ref(database, `users/${user.id}`));
            console.log('History - Raw Firebase data for user:', snapshot.exists() ? snapshot.val() : 'No data');
            
            const voiceHistorySnapshot = await get(ref(database, `users/${user.id}/voiceHistory`));
            console.log('History - Voice history exists:', voiceHistorySnapshot.exists());
            if (voiceHistorySnapshot.exists()) {
              console.log('History - Voice history data:', voiceHistorySnapshot.val());
            }
          } catch (debugError) {
            console.error('History - Debug Firebase check failed:', debugError);
          }
        }
        
        // Get real assessment history from Firebase or localStorage
        const history = await getAssessmentHistory(user?.id);
        
        console.log('History - Assessment history loaded:', history);
        console.log('History - History length:', history.length);
        
        if (history.length === 0) {
          console.log('History - No assessment history found for user:', user?.id);
          console.log('History - User is logged in:', !!user);
          console.log('History - Generating demo data');
          toast.info("No assessment history found. Using demo data for visualization.");
          
          // Generate demo data with realistic model predictions
          const generateModelResults = (baseScore: number, variance: number = 5) => {
            const models = ['gradient_boosting', 'randomForest', 'neuralNetwork', 'svm', 
                           'adaboost', 'extra_trees', 'xgboost', 'ensemble'];
            
            return models.map(modelName => {
              // Create some variance between models
              const scoreVariance = (Math.random() * variance * 2) - variance;
              const score = Math.max(0, Math.min(100, baseScore + scoreVariance));
              const probability = score / 100;
              
              return {
                modelName,
                riskScore: Math.round(score * 10) / 10,
                probability: Math.round(probability * 100) / 100,
                confidence: Math.round((0.65 + Math.random() * 0.3) * 100) / 100
              };
            });
          };
          
          // Generate feature importance based on severity
          const generateFeatureImportance = (severity: number) => {
            const total = 1.0;
            const tremor = Math.round((0.15 + (severity > 50 ? 0.1 : 0)) * 100) / 100;
            const rigidity = Math.round((0.12 + (severity > 40 ? 0.06 : 0)) * 100) / 100;
            const bradykinesia = Math.round((0.14 + (severity > 45 ? 0.08 : 0)) * 100) / 100;
            const posturalInstability = Math.round((0.10 + (severity > 60 ? 0.05 : 0)) * 100) / 100;
            const voiceChanges = Math.round((0.08 + (severity > 30 ? 0.04 : 0)) * 100) / 100;
            
            // Calculate handwriting to make total = 1.0
            const sum = tremor + rigidity + bradykinesia + posturalInstability + voiceChanges;
            const handwriting = Math.round((total - sum) * 100) / 100;
            
            return {
              tremor,
              rigidity,
              bradykinesia,
              posturalInstability,
              voiceChanges,
              handwriting
            };
          };
          
          // Create demo assessments with realistic data
          const demoAssessments = [
            {
              id: 'demo-1',
              date: new Date(),
              result: { riskScore: 45, probability: 0.7, status: 1, modelUsed: 'ensemble' },
              features: {
                tremor: 2, rigidity: 3, bradykinesia: 1, posturalInstability: 2, voiceChanges: 1, handwriting: 2,
                mdvpFo: 150, mdvpJitter: 0.004, mdvpShimmer: 0.03, nhr: 0.01, hnr: 22,
                age: 65
              },
              // Set voiceRecorded to true since we have voice metrics
              voiceRecorded: true,
              allModelResults: generateModelResults(45),
              featureImportance: generateFeatureImportance(45)
            },
            {
              id: 'demo-2',
              date: new Date(Date.now() - 86400000 * 7), // 7 days ago
              result: { riskScore: 65, probability: 0.85, status: 1, modelUsed: 'ensemble' },
              features: {
                tremor: 4, rigidity: 2, bradykinesia: 3, posturalInstability: 2, voiceChanges: 2, handwriting: 3,
                mdvpFo: 130, mdvpJitter: 0.006, mdvpShimmer: 0.04, nhr: 0.02, hnr: 18,
                age: 72
              },
              // Set voiceRecorded to true since we have voice metrics
              voiceRecorded: true,
              allModelResults: generateModelResults(65),
              featureImportance: generateFeatureImportance(65)
            },
            {
              id: 'demo-3',
              date: new Date(Date.now() - 86400000 * 14), // 14 days ago
              result: { riskScore: 25, probability: 0.3, status: 0, modelUsed: 'ensemble' },
              features: {
                tremor: 1, rigidity: 1, bradykinesia: 1, posturalInstability: 1, voiceChanges: 1, handwriting: 1,
                mdvpFo: 170, mdvpJitter: 0.003, mdvpShimmer: 0.02, nhr: 0.008, hnr: 25,
                age: 58
              },
              // Set voiceRecorded to false to simulate a case without voice data
              voiceRecorded: false,
              allModelResults: generateModelResults(25),
              featureImportance: generateFeatureImportance(25)
            },
            {
              id: 'demo-4',
              date: new Date(Date.now() - 86400000 * 21), // 21 days ago
              result: { riskScore: 35, probability: 0.45, status: 0, modelUsed: 'ensemble' },
              features: {
                tremor: 2, rigidity: 1, bradykinesia: 2, posturalInstability: 1, voiceChanges: 1, handwriting: 2,
                mdvpFo: 160, mdvpJitter: 0.0035, mdvpShimmer: 0.025, nhr: 0.009, hnr: 23,
                age: 60
              },
              // Set voiceRecorded to true since we have voice metrics
              voiceRecorded: true,
              allModelResults: generateModelResults(35),
              featureImportance: generateFeatureImportance(35)
            },
          ];
          
          console.log('Generated demo assessments:', demoAssessments);
          setAssessments(demoAssessments);
          setSelectedAssessment(demoAssessments[0]);
          console.log('Set demo data as current assessments');
        } else {
          console.log('History - Using real assessment history:', history);
          console.log('History - Real data count:', history.length);
          console.log('History - First assessment sample:', history[0]);
          
          // Enhance real data with feature importance if missing
          const enhancedHistory = history.map(assessment => {
            if (!assessment.featureImportance) {
              // Generate feature importance based on available features
              const featureImportance: Record<string, number> = {};
              const features = Object.keys(assessment.features);
              
              // Assign importance values that sum to 1.0
              features.forEach((feature, index) => {
                // Skip technical voice metrics
                if (!['mdvpFo', 'mdvpJitter', 'mdvpShimmer', 'nhr', 'hnr', 'age'].includes(feature)) {
                  featureImportance[feature] = 1 / (features.length - 6); // Approximate equal distribution
                }
              });
              
              return {
                ...assessment,
                featureImportance
              };
            }
            return assessment;
          });
          
          setAssessments(enhancedHistory);
          if (enhancedHistory.length > 0) {
            // Select the most recent assessment
            setSelectedAssessment(enhancedHistory[enhancedHistory.length - 1]);
          }
        }
      } catch (error) {
        console.error('Error loading history:', error);
        toast.error('Failed to load assessment history');
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, [user]);
  
  // Track changes to selectedAssessment
  useEffect(() => {
    if (selectedAssessment) {
      console.log('Selected assessment updated:', selectedAssessment);
      console.log('Voice features in selected assessment:', selectedAssessment.features);
      console.log('Voice recorded flag:', selectedAssessment.voiceRecorded);
    }
  }, [selectedAssessment]);
  
  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your assessment history? This cannot be undone.')) {
      clearAssessmentHistory(user?.id);
      setAssessments([]);
      setSelectedAssessment(null);
      toast.success('Assessment history cleared');
    }
  };

  const handleRefreshData = async () => {
    console.log('=== Manual refresh triggered ===');
    setIsLoading(true);
    try {
      const history = await getAssessmentHistory(user?.id);
      console.log('Refreshed history:', history);
      
      if (history.length > 0) {
        setAssessments(history);
        setSelectedAssessment(history[history.length - 1]);
        toast.success(`Loaded ${history.length} assessments from database`);
      } else {
        toast.info('No assessment data found in database');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter assessments based on time range and selected date
  const getFilteredAssessments = () => {
    // Early return if no assessments
    if (!assessments || !Array.isArray(assessments)) {
      return [];
    }
    
    // If a specific date is selected, filter by that date
    if (selectedDate) {
      return assessments.filter(assessment => {
        try {
          if (!assessment || !assessment.date) return false;
          const assessmentDate = new Date(assessment.date);
          return (
            assessmentDate.getDate() === selectedDate.getDate() &&
            assessmentDate.getMonth() === selectedDate.getMonth() &&
            assessmentDate.getFullYear() === selectedDate.getFullYear()
          );
        } catch (error) {
          console.warn('Invalid date in assessment:', assessment);
          return false;
        }
      });
    }
    
    // Otherwise, filter by time range
    if (timeRange === "all") return assessments;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case "week":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      default:
        return assessments;
    }
    
    return assessments.filter(assessment => {
      try {
        if (!assessment || !assessment.date) return false;
        return new Date(assessment.date) >= cutoffDate;
      } catch (error) {
        console.warn('Invalid date in assessment:', assessment);
        return false;
      }
    });
  };

  const filteredAssessments = getFilteredAssessments();
  
  // Debug logging
  console.log('History - assessments:', assessments);
  console.log('History - filteredAssessments:', filteredAssessments);
  console.log('History - isLoading:', isLoading);
  
  // Clear the selected date when time range changes
  useEffect(() => {
    setSelectedDate(undefined);
  }, [timeRange]);
  
  // Get risk trend (increasing, decreasing, stable)
  const getRiskTrend = () => {
    if (!filteredAssessments || filteredAssessments.length < 2) {
      return { trend: "stable", label: "Stable", color: "text-blue-600 dark:text-blue-400" };
    }
    
    const sortedAssessments = [...filteredAssessments]
      .filter(assessment => assessment && assessment.result && typeof assessment.result.riskScore === 'number')
      .sort((a, b) => {
        try {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        } catch (error) {
          return 0;
        }
      });
    
    if (sortedAssessments.length < 2) {
      return { trend: "stable", label: "Stable", color: "text-blue-600 dark:text-blue-400" };
    }
    
    const firstScore = sortedAssessments[0].result.riskScore;
    const lastScore = sortedAssessments[sortedAssessments.length - 1].result.riskScore;
    const difference = lastScore - firstScore;
    
    if (difference > 5) {
      return { trend: "increasing", label: "Increasing", color: "text-red-600 dark:text-red-400" };
    } else if (difference < -5) {
      return { trend: "decreasing", label: "Decreasing", color: "text-green-600 dark:text-green-400" };
    } else {
      return { trend: "stable", label: "Stable", color: "text-blue-600 dark:text-blue-400" };
    }
  };

  // Get average risk score
  const getAverageRiskScore = () => {
    if (!filteredAssessments || filteredAssessments.length === 0) return 0;
    
    const validAssessments = filteredAssessments.filter(assessment => 
      assessment && assessment.result && typeof assessment.result.riskScore === 'number'
    );
    
    if (validAssessments.length === 0) return 0;
    
    const sum = validAssessments.reduce((acc, assessment) => 
      acc + assessment.result.riskScore, 0
    );
    
    return Math.round(sum / validAssessments.length);
  };

  // Get risk category based on average score
  const getRiskCategory = (score: number) => {
    if (score < 20) return { label: "Low Risk", color: "bg-green-500", textColor: "text-green-600 dark:text-green-400" };
    if (score < 50) return { label: "Moderate Risk", color: "bg-yellow-500", textColor: "text-yellow-600 dark:text-yellow-400" };
    if (score < 80) return { label: "High Risk", color: "bg-orange-500", textColor: "text-orange-600 dark:text-orange-400" };
    return { label: "Very High Risk", color: "bg-red-500", textColor: "text-red-600 dark:text-red-400" };
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <div className="relative mx-auto mb-4">
                <div className="h-16 w-16 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 animate-spin"></div>
              </div>
              <h3 className="text-xl font-medium mb-2">Loading Your History</h3>
              <p className="text-muted-foreground">Please wait while we retrieve your assessment data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <HistoryIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              Assessment History
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your assessment history and monitor changes over time
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Debug button - only show in development */}
            {process.env.NODE_ENV === 'development' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={async () => {
                  console.log('=== DEBUG: Manual data check ===');
                  console.log('Current user:', user);
                  console.log('User ID:', user?.id);
                  
                  if (user?.id) {
                    try {
                      const { ref, get, getDatabase } = await import('firebase/database');
                      const { app } = await import('@/lib/firebase');
                      const database = getDatabase(app);
                      
                      // Check user profile
                      const profileSnapshot = await get(ref(database, `users/${user.id}/profile`));
                      console.log('Profile exists:', profileSnapshot.exists());
                      if (profileSnapshot.exists()) {
                        console.log('Profile data:', profileSnapshot.val());
                      }
                      
                      // Check voice history
                      const voiceHistorySnapshot = await get(ref(database, `users/${user.id}/voiceHistory`));
                      console.log('Voice history exists:', voiceHistorySnapshot.exists());
                      if (voiceHistorySnapshot.exists()) {
                        console.log('Voice history data:', voiceHistorySnapshot.val());
                      }
                      
                      // Check all user data
                      const allUserDataSnapshot = await get(ref(database, `users/${user.id}`));
                      console.log('All user data:', allUserDataSnapshot.exists() ? allUserDataSnapshot.val() : 'No data');
                      
                      // Try to reload history
                      const history = await getAssessmentHistory(user.id);
                      console.log('Reloaded history:', history);
                      
                    } catch (error) {
                      console.error('Debug check failed:', error);
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
              onClick={() => navigate('/')}
              className="flex items-center gap-1"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshData}
              className="flex items-center gap-1"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/symptom-checker')}
              className="flex items-center gap-1"
            >
              <ActivitySquare className="h-4 w-4" />
              <span className="hidden sm:inline">New Assessment</span>
            </Button>
            
            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant={selectedDate ? "default" : "outline"} 
                  size="sm"
                  className={`flex items-center gap-1 ${selectedDate ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {selectedDate ? (
                    <span className="hidden sm:inline">{format(selectedDate, 'MMM d, yyyy')}</span>
                  ) : (
                    <span className="hidden sm:inline">Pick Date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
                {selectedDate && (
                  <div className="p-3 border-t flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {format(selectedDate, 'MMMM d, yyyy')}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedDate(undefined)}
                      className="h-8 px-2"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Clear</span>
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
            
            {/* Time Range Filter (disabled when date is selected) */}
            <Select 
              value={timeRange} 
              onValueChange={setTimeRange}
              disabled={!!selectedDate}
            >
              <SelectTrigger className="w-[130px] h-9">
                <Filter className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Past Week</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
                <SelectItem value="quarter">Past 3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Date Filter Indicator */}
        {selectedDate && (
          <div className="mb-4">
            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/30 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span>
                  Showing assessments for <span className="font-medium">{format(selectedDate, 'MMMM d, yyyy')}</span>
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedDate(undefined)}
                className="h-8"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filter
              </Button>
            </div>
          </div>
        )}
        
        {/* Assessment Count Summary */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border-indigo-100 dark:border-indigo-900/50">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-full">
                    <ClipboardList className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {selectedDate ? "Assessments on This Date" : "Total Assessments"}
                    </p>
                    <p className="text-2xl font-bold">{filteredAssessments.length}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
                    <Gauge className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Risk Score</p>
                    <p className="text-2xl font-bold">{getAverageRiskScore()}</p>
                    <p className={`text-xs ${getRiskCategory(getAverageRiskScore()).textColor}`}>
                      {getRiskCategory(getAverageRiskScore()).label}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Risk Trend</p>
                    <p className={`text-2xl font-bold ${getRiskTrend().color}`}>
                      {getRiskTrend().label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Based on {filteredAssessments.length} assessments
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="assessments" className="flex items-center gap-1">
              <ClipboardList className="h-4 w-4" />
              <span>Assessment History</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-1">
              <PieChartIcon className="h-4 w-4" />
              <span>Data Summary</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {filteredAssessments.length === 0 && selectedDate ? (
              <Card>
                <CardContent className="py-10">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-2">No Data Available</h3>
                    <p className="text-muted-foreground mb-4">
                      No assessments found for {format(selectedDate, 'MMMM d, yyyy')}.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedDate(undefined)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear Date Filter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {/* Risk Score Progression Chart */}
                <div>
                  <ProgressTracker assessments={filteredAssessments} />
                </div>
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        Assessment Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground">First Assessment</p>
                            <p className="font-medium">
                              {(() => {
                                const validAssessments = filteredAssessments.filter(a => a && a.date);
                                if (validAssessments.length === 0) return 'N/A';
                                try {
                                  const sorted = validAssessments.sort((a, b) => 
                                    new Date(a.date).getTime() - new Date(b.date).getTime());
                                  return format(new Date(sorted[0].date), 'MMM d, yyyy');
                                } catch (error) {
                                  return 'N/A';
                                }
                              })()}
                            </p>
                          </div>
                          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground">Latest Assessment</p>
                            <p className="font-medium">
                              {(() => {
                                const validAssessments = filteredAssessments.filter(a => a && a.date);
                                if (validAssessments.length === 0) return 'N/A';
                                try {
                                  const sorted = validAssessments.sort((a, b) => 
                                    new Date(b.date).getTime() - new Date(a.date).getTime());
                                  return format(new Date(sorted[0].date), 'MMM d, yyyy');
                                } catch (error) {
                                  return 'N/A';
                                }
                              })()}
                            </p>
                          </div>
                          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground">Lowest Risk Score</p>
                            <p className="font-medium">
                              {(() => {
                                const validScores = filteredAssessments
                                  .filter(a => a && a.result && typeof a.result.riskScore === 'number')
                                  .map(a => a.result.riskScore);
                                return validScores.length > 0 ? Math.min(...validScores) : 'N/A';
                              })()}
                            </p>
                          </div>
                          <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground">Highest Risk Score</p>
                            <p className="font-medium">
                              {(() => {
                                const validScores = filteredAssessments
                                  .filter(a => a && a.result && typeof a.result.riskScore === 'number')
                                  .map(a => a.result.riskScore);
                                return validScores.length > 0 ? Math.max(...validScores) : 'N/A';
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        Risk Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ErrorBoundary>
                        <DatasetSummaryChart assessments={filteredAssessments} />
                      </ErrorBoundary>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Assessment History Tab */}
          <TabsContent value="assessments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Assessment History
                </CardTitle>
                <CardDescription>
                  Detailed history of all your assessments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredAssessments.length === 0 ? (
                  <div className="text-center py-8">
                    {selectedDate ? (
                      <div>
                        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                        <p className="text-muted-foreground mb-2">No assessments found for {format(selectedDate, 'MMMM d, yyyy')}.</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setSelectedDate(undefined)}
                          className="mt-2"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Clear Date Filter
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-muted-foreground">No assessment history found for the selected time period.</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate('/symptom-checker')}
                          className="mt-4"
                        >
                          Complete Your First Assessment
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Risk Score</TableHead>
                          <TableHead>Risk Level</TableHead>
                          <TableHead>Model Used</TableHead>
                          <TableHead>Voice Recorded</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAssessments
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((assessment) => (
                            <TableRow 
                              key={assessment.id}
                              className={selectedAssessment?.id === assessment.id ? 'bg-indigo-50 dark:bg-indigo-950/20' : ''}
                            >
                              <TableCell>
                                {format(new Date(assessment.date), 'MMM d, yyyy')}
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(assessment.date), 'h:mm a')}
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {assessment.result.riskScore}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline"
                                  className={`
                                    ${assessment.result.riskScore < 20 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
                                    ${assessment.result.riskScore >= 20 && assessment.result.riskScore < 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : ''}
                                    ${assessment.result.riskScore >= 50 && assessment.result.riskScore < 80 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' : ''}
                                    ${assessment.result.riskScore >= 80 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : ''}
                                  `}
                                >
                                  {assessment.result.riskScore < 20 ? 'Low Risk' : 
                                   assessment.result.riskScore < 50 ? 'Moderate Risk' : 
                                   assessment.result.riskScore < 80 ? 'High Risk' : 
                                   'Very High Risk'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {assessment.result.modelUsed || 'ensemble'}
                              </TableCell>
                              <TableCell>
                                {assessment.voiceRecorded ? (
                                  <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                    <Mic className="h-3 w-3 mr-1" />
                                    Yes
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300">
                                    No
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setSelectedAssessment(assessment)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/symptom-checker')}
                >
                  New Assessment
                </Button>
                
                {filteredAssessments.length > 0 && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleClearHistory}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear History
                  </Button>
                )}
              </CardFooter>
            </Card>
            
            {/* Selected Assessment Details */}
            {selectedAssessment && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Assessment Details
                  </CardTitle>
                  <CardDescription>
                    Detailed information about the selected assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Assessment Information</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Date</span>
                          <span className="font-medium">{format(new Date(selectedAssessment.date), 'MMM d, yyyy h:mm a')}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Risk Score</span>
                          <span className="font-medium">{selectedAssessment.result.riskScore}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Risk Level</span>
                          <span className={`font-medium ${
                            selectedAssessment.result.riskScore < 20 ? 'text-green-600 dark:text-green-400' : 
                            selectedAssessment.result.riskScore < 50 ? 'text-yellow-600 dark:text-yellow-400' : 
                            selectedAssessment.result.riskScore < 80 ? 'text-orange-600 dark:text-orange-400' : 
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {selectedAssessment.result.riskScore < 20 ? 'Low Risk' : 
                             selectedAssessment.result.riskScore < 50 ? 'Moderate Risk' : 
                             selectedAssessment.result.riskScore < 80 ? 'High Risk' : 
                             'Very High Risk'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Probability</span>
                          <span className="font-medium">{(selectedAssessment.result.probability * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Model Used</span>
                          <span className="font-medium">{selectedAssessment.result.modelUsed || 'ensemble'}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-muted-foreground">Voice Recorded</span>
                          <span className="font-medium">{selectedAssessment.voiceRecorded ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Symptom Information</h3>
                      <div className="space-y-3">
                        {Object.entries(selectedAssessment.features)
                          .filter(([key]) => !['mdvpFo', 'mdvpJitter', 'mdvpShimmer', 'nhr', 'hnr', 'age'].includes(key))
                          .map(([key, value]) => (
                            <div key={key} className="flex justify-between border-b pb-2">
                              <span className="text-muted-foreground capitalize">{key}</span>
                              <span className="font-medium">{value} / 10</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Data Summary Tab */}
          <TabsContent value="data">
            {filteredAssessments.length === 0 && selectedDate ? (
              <Card>
                <CardContent className="py-10">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                    <h3 className="text-lg font-medium mb-2">No Data Available</h3>
                    <p className="text-muted-foreground mb-4">
                      No assessments found for {format(selectedDate, 'MMMM d, yyyy')}.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedDate(undefined)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear Date Filter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      Risk Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ErrorBoundary>
                      <DatasetSummaryChart assessments={filteredAssessments} />
                    </ErrorBoundary>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      Model Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ErrorBoundary>
                      {selectedAssessment?.allModelResults ? (
                        <ModelComparison 
                          modelResults={selectedAssessment.allModelResults} 
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-muted-foreground">Select an assessment to view model comparison</p>
                        </div>
                      )}
                    </ErrorBoundary>
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      Symptom Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ErrorBoundary>
                      <SymptomTrendsChart assessments={filteredAssessments} />
                    </ErrorBoundary>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default History;

