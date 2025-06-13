import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Assessment, getAssessmentHistory, clearAssessmentHistory } from '@/utils/assessmentHistory';
import { toast } from 'sonner';
import ProgressTracker from '@/components/ProgressTracker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ModelComparisonChart from '@/components/ModelComparisonChart';
import DatasetSummaryChart from '@/components/DatasetSummaryChart';
import SymptomTrendsChart from '@/components/SymptomTrendsChart';
import FeatureImportanceChart from '@/components/FeatureImportanceChart';
import VoiceAnalysisVisualizer from '@/components/VoiceAnalysisVisualizer';
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
  Database
} from 'lucide-react';
import { userInfo } from 'os';

const History = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<string>("all");

  useEffect(() => {
    async function loadHistory() {
      try {
        setIsLoading(true);
        // Get real assessment history from Firebase or localStorage
        const history = await getAssessmentHistory(user?.id);
        
        console.log('Assessment history loaded:', history);
        
        if (history.length === 0) {
          console.log('No assessment history found, generating demo data');
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
          console.log('Using real assessment history:', history);
          
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
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
            <HistoryIcon className="h-8 w-8 text-purple-500" />
            <span className="bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
              Assessment History
            </span>
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
            Track your symptom assessments and voice analysis over time.
        </p>
      </div>
        {assessments.length > 0 && (
          <Button 
            onClick={() => navigate("/app/symptom-check")}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            Take New Assessment
          </Button>
        )}
      </div>
      
      {assessments.length === 0 ? (
        <Card className="bg-gradient-to-br from-blue-100 via-white to-white dark:from-blue-900/40 dark:via-zinc-900/90 dark:to-zinc-900 border-0 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2 justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-500" /> No Assessments Yet
              </h3>
              <p className="text-muted-foreground">
                You haven't taken any symptom assessments yet. Complete an assessment to track your symptoms over time.
              </p>
              <Button 
                onClick={() => navigate("/app/symptom-check")} 
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                Take an Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-purple-100 via-white to-white dark:from-purple-900/40 dark:via-zinc-900 dark:to-zinc-900 border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" /> Total Assessments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{assessments.length}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(assessments[0].date), 'MMM d, yyyy')} - {format(new Date(assessments[assessments.length - 1].date), 'MMM d, yyyy')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-100 via-white to-white dark:from-blue-900/40 dark:via-zinc-900/90 dark:to-zinc-900 border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
                  <Database className="h-5 w-5" /> Dataset Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {assessments.filter(a => a.voiceRecorded).length}
                  </p>
                  <span className="text-sm text-muted-foreground">voice samples</span>
            </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Out of {assessments.length} total assessments
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-100 via-white to-white dark:from-green-900/40 dark:via-zinc-900/90 dark:to-zinc-900 border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
                  <Mic className="h-5 w-5" /> Voice Analysis
                  </CardTitle>
                </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {((assessments.filter(a => a.voiceRecorded).length / assessments.length) * 100).toFixed(1)}%
                  </p>
                  <span className="text-sm text-muted-foreground">completion</span>
                  </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Voice analysis coverage
                </p>
                </CardContent>
              </Card>
          </div>
          
          {/* Main Charts Section */}
          <div className="space-y-6">
            <div className="bg-card border-0 shadow-lg rounded-lg p-4">
              <Tabs defaultValue="all" value={activeChart} onValueChange={setActiveChart} className="w-full">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                  <h2 className="text-xl font-semibold text-foreground">Assessment Visualizations</h2>
                  <div className="overflow-x-auto pb-2">
                    <TabsList className="bg-muted/60 w-fit">
                      <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-2 sm:px-3">
                        All Charts
                      </TabsTrigger>
                      <TabsTrigger value="summary" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-3">
                        <Database className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1" />
                        <span className="hidden xs:inline">Summary</span>
                      </TabsTrigger>
                      <TabsTrigger value="symptoms" className="data-[state=active]:bg-green-500 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-3">
                        <ActivitySquare className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1" />
                        <span className="hidden xs:inline">Symptoms</span>
                      </TabsTrigger>
                      <TabsTrigger value="features" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-3">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1" />
                        <span className="hidden xs:inline">Features</span>
                      </TabsTrigger>
                      <TabsTrigger value="voice" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-3">
                        <Mic className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1" />
                        <span className="hidden xs:inline">Voice</span>
                      </TabsTrigger>
                      <TabsTrigger value="models" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white text-xs sm:text-sm px-2 sm:px-3">
                        <Scale className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-1" />
                        <span className="hidden xs:inline">Models</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>
                
                <TabsContent value="all" className="space-y-8 mt-3">
                  {/* Dataset Summary */}
                  <Card className="bg-card border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <Database className="h-5 w-5" /> Dataset Summary
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Distribution of assessment risk levels
                      </p>
                    </CardHeader>
                    <CardContent className="pt-1 pb-4">
                      <div className="h-[380px]">
                        <DatasetSummaryChart assessments={assessments} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Symptom Trends */}
                  <Card className="bg-card border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2 text-green-700 dark:text-green-300">
                        <ActivitySquare className="h-5 w-5" /> Symptom Trends
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Tracking symptoms and risk score over time
                      </p>
                    </CardHeader>
                    <CardContent className="pt-1 pb-4">
                      <div className="h-[380px]">
                        <SymptomTrendsChart assessments={assessments} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Feature Importance */}
                  <Card className="bg-card border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                        <Star className="h-5 w-5" /> Feature Importance
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Relative importance of each symptom in the analysis for the selected assessment.
                      </p>
                    </CardHeader>
                    <CardContent className="pt-1 pb-4">
                      <div className="h-[380px]">
                        <FeatureImportanceChart assessments={selectedAssessment ? [selectedAssessment] : []} /> 
                      </div>
                    </CardContent>
                  </Card>

                  {/* Voice Analysis - always show with sample data if needed */}
                  <Card className="bg-card border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2 text-purple-700 dark:text-purple-300">
                        <Mic className="h-5 w-5" /> Voice Analysis
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedAssessment?.voiceRecorded 
                          ? "Detailed analysis of voice biomarkers" 
                          : "Sample visualization of voice analysis"}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-1 pb-4 h-[450px]">
                      <div className="h-[420px]">
                        <VoiceAnalysisVisualizer 
                          voiceFeatures={selectedAssessment?.features || null} 
                          loading={false}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Model Performance */}
                  <Card className="bg-card/80 dark:bg-black/20 border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-purple-500" /> Model Performance Comparison
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[450px] p-2">
                      <ModelComparisonChart modelResults={selectedAssessment?.allModelResults || []} />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Individual Chart Tabs */}
                <TabsContent value="summary" className="mt-2">
                  <Card className="bg-card border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <Database className="h-5 w-5" /> Dataset Summary
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Distribution of assessment risk levels
                      </p>
                    </CardHeader>
                    <CardContent className="pt-2 pb-6">
                      <div className="h-[500px]">
                        <DatasetSummaryChart assessments={assessments} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="symptoms" className="mt-2">
                  <Card className="bg-card border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2 text-green-700 dark:text-green-300">
                        <ActivitySquare className="h-5 w-5" /> Symptom Trends
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Tracking symptoms and risk score over time
                      </p>
                    </CardHeader>
                    <CardContent className="pt-2 pb-6">
                      <div className="h-[500px]">
                        <SymptomTrendsChart assessments={assessments} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="features" className="mt-2">
                  <Card className="bg-card border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                        <Star className="h-5 w-5" /> Feature Importance
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Relative importance of each symptom in the analysis for the selected assessment.
                      </p>
                    </CardHeader>
                    <CardContent className="pt-2 pb-6">
                      <div className="h-[500px]">
                        <FeatureImportanceChart assessments={selectedAssessment ? [selectedAssessment] : []} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Show voice analysis tab regardless of whether voice was recorded - dummy data will be used */}
                <TabsContent value="voice" className="mt-2">
                  <Card className="bg-card border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2 text-purple-700 dark:text-purple-300">
                        <Mic className="h-5 w-5" /> Voice Analysis
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedAssessment?.voiceRecorded 
                          ? "Detailed analysis of voice biomarkers" 
                          : "Sample visualization of voice analysis"}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-1 pb-4 h-[450px]">
                      <div className="h-[550px] w-full">
                        <VoiceAnalysisVisualizer 
                          voiceFeatures={selectedAssessment?.features}
                          loading={false}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="models" className="mt-3">
                  <Card className="bg-card border-0 shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl font-semibold flex items-center gap-2 text-teal-700 dark:text-teal-300">
                        <Scale className="h-5 w-5" /> Model Performance
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Comparison of different machine learning models
                      </p>
                    </CardHeader>
                    <CardContent className="h-[450px] p-2">
                      <ModelComparisonChart 
                        modelResults={selectedAssessment?.allModelResults || []}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default History;
