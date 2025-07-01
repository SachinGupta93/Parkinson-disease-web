import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useMultiModelPrediction } from '@/hooks/useMultiModelPrediction';
import { CompleteVoiceData } from '@/services/api';
import ModelComparison from '@/components/ModelComparison';
import MultiModelFeatureImportance from '@/components/MultiModelFeatureImportance';
import EnhancedVoiceRecorder from '@/components/EnhancedVoiceRecorder';
import { 
  Loader2, 
  Mic, 
  Home, 
  BarChart4, 
  Brain, 
  ChevronRight, 
  RefreshCw, 
  AlertCircle,
  Info,
  BarChart
} from 'lucide-react';

const MultiModelAnalysis: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('record');
  const { loading, error, results, analyzeAndPredictFromVoiceFile, predictWithAllModels, reset } = useMultiModelPrediction();

  const handleVoiceAnalyzed = async (voiceData: CompleteVoiceData) => {
    try {
      // Use the voice data directly instead of re-analyzing the file
      await predictWithAllModels(voiceData);
      setActiveTab('results');
      
      toast({
        title: 'Analysis Complete',
        description: 'Your voice has been analyzed by multiple AI models',
        variant: 'default',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to analyze voice recording. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    reset();
    setActiveTab('record');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Multi-Model Analysis
            </h1>
            <p className="text-muted-foreground mt-1">
              Advanced voice analysis using multiple machine learning models for comprehensive assessment
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Mic className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              Voice Analysis with Multiple Models
            </CardTitle>
            <CardDescription className="text-sm">
              Compare predictions from different machine learning models for a more comprehensive Parkinson's risk assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b">
                <TabsList className="w-full rounded-none h-12 bg-transparent border-b">
                  <TabsTrigger 
                    value="record" 
                    disabled={loading}
                    className="flex-1 h-12 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-none"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Record Voice
                  </TabsTrigger>
                  <TabsTrigger 
                    value="results" 
                    disabled={!results}
                    className="flex-1 h-12 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-none"
                  >
                    <BarChart4 className="h-4 w-4 mr-2" />
                    View Results
                  </TabsTrigger>
                </TabsList>
              </div>
              
              {/* Record Tab */}
              <TabsContent value="record" className="p-6 focus:outline-none">
                <div className="max-w-3xl mx-auto">
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 p-4 rounded-lg border mb-8">
                    <div className="flex gap-3 items-start">
                      <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-sm text-indigo-900 dark:text-indigo-300 mb-1">How it works</h3>
                        <p className="text-sm text-indigo-800/80 dark:text-indigo-400/80">
                          Record or upload a voice sample to analyze with multiple Parkinson's detection models. 
                          Each model will provide its own assessment, giving you a more comprehensive analysis.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                          <div className="bg-white/50 dark:bg-gray-900/50 p-2 rounded border border-indigo-100 dark:border-indigo-900/30">
                            <div className="flex items-center gap-2 text-xs font-medium text-indigo-800 dark:text-indigo-300 mb-1">
                              <Mic className="h-3 w-3" />
                              <span>Record Voice</span>
                            </div>
                            <p className="text-xs text-indigo-700 dark:text-indigo-400">Say "aaaaah" for 5 seconds</p>
                          </div>
                          <div className="bg-white/50 dark:bg-gray-900/50 p-2 rounded border border-indigo-100 dark:border-indigo-900/30">
                            <div className="flex items-center gap-2 text-xs font-medium text-indigo-800 dark:text-indigo-300 mb-1">
                              <Brain className="h-3 w-3" />
                              <span>AI Analysis</span>
                            </div>
                            <p className="text-xs text-indigo-700 dark:text-indigo-400">Multiple models process your voice</p>
                          </div>
                          <div className="bg-white/50 dark:bg-gray-900/50 p-2 rounded border border-indigo-100 dark:border-indigo-900/30">
                            <div className="flex items-center gap-2 text-xs font-medium text-indigo-800 dark:text-indigo-300 mb-1">
                              <BarChart4 className="h-3 w-3" />
                              <span>Compare Results</span>
                            </div>
                            <p className="text-xs text-indigo-700 dark:text-indigo-400">See how different models assess your risk</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-950 rounded-lg border">
                      <div className="relative">
                        <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400" />
                        <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full border-2 border-indigo-400 opacity-20"></div>
                      </div>
                      <p className="mt-4 font-medium text-lg">Analyzing voice sample...</p>
                      <p className="text-muted-foreground text-sm">This may take a few moments</p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-950 rounded-lg border shadow-sm p-6">
                      <EnhancedVoiceRecorder onVoiceAnalyzed={handleVoiceAnalyzed} />
                    </div>
                  )}
                  
                  {error && (
                    <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-900/50 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium mb-1">Error</p>
                        <p className="text-sm">{error}</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              {/* Results Tab */}
              <TabsContent value="results" className="focus:outline-none">
                {results ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 p-4 border-b">
                      <div className="flex gap-3 items-start max-w-3xl mx-auto">
                        <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h3 className="font-medium text-sm text-indigo-900 dark:text-indigo-300 mb-1">Analysis Complete</h3>
                          <p className="text-sm text-indigo-800/80 dark:text-indigo-400/80">
                            Your voice sample has been analyzed by multiple machine learning models. 
                            Review the results below to see how different models assess your Parkinson's risk.
                          </p>
                        </div>
                      </div>
                    </div>
                  
                    <div className="px-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Model Comparison Card */}
                        <Card className="border shadow-sm hover:shadow-md transition-all duration-300">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                              Model Predictions
                            </CardTitle>
                            <CardDescription>
                              Comparison of risk assessments across different models
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ModelComparison multiModelResults={results} />
                          </CardContent>
                        </Card>

                        {/* Risk Score Card */}
                        <Card className="border shadow-sm hover:shadow-md transition-all duration-300">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <BarChart4 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                              Risk Assessment
                            </CardTitle>
                            <CardDescription>
                              {results?.models?.ensemble 
                                ? "Summary of risk assessment from the ensemble model" 
                                : "Comprehensive risk evaluation from model predictions"}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm text-muted-foreground mb-4">
                              {results?.models?.ensemble 
                                ? "The ensemble model combines insights from all individual models for a more balanced prediction."
                                : "This summary provides a comprehensive risk assessment based on available model predictions."}
                            </div>
                            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 rounded-lg border">
                              {results?.models?.ensemble ? (
                                <>
                                  <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                                    {Math.round(results.models.ensemble.risk_score || 0)}
                                  </div>
                                  <div className="text-sm text-indigo-800 dark:text-indigo-300 mb-4">Risk Score</div>
                                  <div className="w-full max-w-md h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${
                                        results.models.ensemble.risk_score < 30 ? 'bg-green-500' :
                                        results.models.ensemble.risk_score < 50 ? 'bg-yellow-500' :
                                        results.models.ensemble.risk_score < 70 ? 'bg-orange-500' :
                                        'bg-red-500'
                                      }`}
                                      style={{ width: `${Math.min(100, Math.max(0, results.models.ensemble.risk_score))}%` }}
                                    ></div>
                                  </div>
                                  <div className="flex justify-between w-full max-w-md mt-1 text-xs text-muted-foreground">
                                    <span>Low Risk</span>
                                    <span>High Risk</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  {/* Calculate average risk score from available models as fallback */}
                                  {(() => {
                                    console.log("Risk Score Calculation - results structure:", results);
                                    
                                    // Get all available models with risk scores
                                    let modelsWithRiskScores: [string, any][] = [];
                                    
                                    // Check if we have a nested models object
                                    if (results?.models && typeof results.models === 'object') {
                                      console.log("Risk Score Calculation - Using nested models structure");
                                      modelsWithRiskScores = Object.entries(results.models)
                                        .filter(([_, modelData]) => modelData && typeof modelData.risk_score === 'number');
                                    } else {
                                      // Check for direct model properties at root level
                                      console.log("Risk Score Calculation - Using direct model properties");
                                      
                                      // These are common non-model properties
                                      const nonModelProps = ['models', 'model_details', 'feature_importance', 'summary', 
                                                           'timestamp', 'features_used', 'loaded_models', 'chart_data'];
                                      
                                      // Filter for model objects with risk_score
                                      modelsWithRiskScores = Object.entries(results || {})
                                        .filter(([key, value]) => {
                                          const isModelObject = typeof value === 'object' && 
                                                              value !== null && 
                                                              !nonModelProps.includes(key);
                                          
                                          const hasRiskScore = isModelObject && 
                                                             typeof (value as any).risk_score === 'number';
                                          
                                          return isModelObject && hasRiskScore;
                                        });
                                      
                                      // If we have prediction and probability but no risk_score, calculate it
                                      if (modelsWithRiskScores.length === 0) {
                                        console.log("Risk Score Calculation - No models with risk_score found, checking for probability");
                                        
                                        const modelsWithPrediction = Object.entries(results || {})
                                          .filter(([key, value]) => {
                                            // Skip non-model properties
                                            if (nonModelProps.includes(key)) return false;
                                            
                                            // Check if it's an object
                                            const isModelObject = typeof value === 'object' && value !== null;
                                            if (!isModelObject) return false;
                                            
                                            // Log each potential model for debugging
                                            console.log(`Risk Score Calculation - Checking model candidate: ${key}`, value);
                                            
                                            // Check for prediction or probability
                                            const hasPrediction = typeof (value as any).prediction === 'number';
                                            const hasProbability = typeof (value as any).probability === 'number';
                                            
                                            // Accept if it has either prediction or probability
                                            return hasPrediction || hasProbability;
                                          });
                                        
                                        console.log("Risk Score Calculation - Models with prediction/probability:", modelsWithPrediction);
                                        
                                        // Calculate risk score as probability * 100 for models with prediction
                                        modelsWithRiskScores = modelsWithPrediction.map(([key, value]) => {
                                          // Determine risk score from available data
                                          let riskScore = 0;
                                          
                                          // If probability exists, use it (scaled to 0-100)
                                          if (typeof (value as any).probability === 'number') {
                                            riskScore = (value as any).probability * 100;
                                          } 
                                          // If only prediction exists (0 or 1), use a default risk score
                                          else if (typeof (value as any).prediction === 'number') {
                                            riskScore = (value as any).prediction === 1 ? 75 : 25; // Default values
                                          }
                                          
                                          // Create a new object with the calculated risk_score
                                          const modelWithRiskScore = {
                                            ...value,
                                            risk_score: riskScore
                                          };
                                          
                                          console.log(`Risk Score Calculation - Calculated risk score for ${key}:`, riskScore);
                                          return [key, modelWithRiskScore];
                                        });
                                      }
                                    }
                                    
                                    console.log("Risk Score Calculation - Models with risk scores:", modelsWithRiskScores);
                                    
                                    // Calculate average risk score if we have models
                                    if (modelsWithRiskScores.length > 0) {
                                      const totalRiskScore = modelsWithRiskScores.reduce((sum, [_, modelData]) => {
                                        const riskScore = (modelData as any).risk_score || 0;
                                        return sum + riskScore;
                                      }, 0);
                                      
                                      const averageRiskScore = totalRiskScore / modelsWithRiskScores.length;
                                      
                                      return (
                                        <>
                                          <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                                            {Math.round(averageRiskScore)}
                                          </div>
                                          <div className="text-sm text-indigo-800 dark:text-indigo-300 mb-4">Average Risk Score</div>
                                          <div className="w-full max-w-md h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                              className={`h-full ${
                                                averageRiskScore < 30 ? 'bg-green-500' :
                                                averageRiskScore < 50 ? 'bg-yellow-500' :
                                                averageRiskScore < 70 ? 'bg-orange-500' :
                                                'bg-red-500'
                                              }`}
                                              style={{ width: `${Math.min(100, Math.max(0, averageRiskScore))}%` }}
                                            ></div>
                                          </div>
                                          <div className="flex justify-between w-full max-w-md mt-1 text-xs text-muted-foreground">
                                            <span>Low Risk</span>
                                            <span>High Risk</span>
                                          </div>
                                          <div className="mt-2 text-xs text-muted-foreground">
                                            <span className="italic">Based on average of {modelsWithRiskScores.length} models</span>
                                          </div>
                                        </>
                                      );
                                    }
                                    
                                    // If no models with risk scores are available
                                    return (
                                      <div className="text-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-indigo-300 dark:text-indigo-700 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                          <line x1="12" y1="9" x2="12" y2="13"></line>
                                          <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                        </svg>
                                        <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Risk score calculation unavailable</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Check individual model predictions for risk assessment
                                        </p>
                                      </div>
                                    );
                                  })()}
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      {/* Feature Importance Card */}
                      <Card className="border shadow-sm hover:shadow-md transition-all duration-300 mb-6">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            Feature Importance Analysis
                          </CardTitle>
                          <CardDescription>
                            Key voice biomarkers that influenced the model predictions
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* Add console logs to debug results structure */}
                          {console.log("MultiModelAnalysis - Results structure:", results)}
                          {console.log("MultiModelAnalysis - Results keys:", Object.keys(results || {}))}
                          {console.log("MultiModelAnalysis - Has nested models:", Boolean(results?.models))}
                          <MultiModelFeatureImportance multiModelResults={results} />
                        </CardContent>
                      </Card>
                      
                      <div className="flex justify-center mt-8 mb-6">
                        <Button 
                          onClick={handleReset}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-6 py-6 h-auto"
                        >
                          <RefreshCw className="h-5 w-5" />
                          Analyze Another Voice Sample
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white dark:bg-gray-950 border-t">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 8v4"></path>
                      <path d="M12 16h.01"></path>
                    </svg>
                    <p className="text-lg font-medium mb-2">No results available</p>
                    <p className="text-muted-foreground mb-6">Please record or upload a voice sample first</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('record')} 
                      className="flex items-center gap-2 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                    >
                      <Mic className="h-4 w-4" />
                      Go to Recording
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="bg-gray-50 dark:bg-gray-900/50 border-t p-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span>This analysis uses multiple machine learning models to provide a comprehensive assessment of Parkinson's risk factors based on voice biomarkers.</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default MultiModelAnalysis;