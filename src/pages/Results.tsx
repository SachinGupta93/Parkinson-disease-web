import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { 
  ParkinsonsFeatures, 
  ModelType, 
  PredictionResult
} from "@/utils/parkinsonPredictor";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveAssessment } from "@/utils/assessmentHistory";
import FeatureImportance from "@/components/FeatureImportance";
import ModelComparison from "@/components/ModelComparison";
import ModelComparisonChart from "@/components/ModelComparisonChart";
import { enhancedMockFastApi } from "@/utils/enhancedMockFastApi";
import { toast } from "sonner";
import { AlertTriangle, Gauge, LineChart, PercentCircle, ClipboardList, Brain, Scale } from "lucide-react";
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';

interface ResultsState {
  formData?: {
    tremor: number;
    rigidity: number;
    bradykinesia: number;
    posturalInstability: number;
    voiceChanges: number;
    handwriting: number;
    age: number;
  };
  voiceFeatures?: Partial<ParkinsonsFeatures>;
  selectedModel?: ModelType | 'ensemble';
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultsState | undefined;
  const [riskScore, setRiskScore] = useState(0);
  const [probability, setProbability] = useState(0);
  const [status, setStatus] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [modelUsed, setModelUsed] = useState<ModelType | 'ensemble'>('ensemble');
  const [confidence, setConfidence] = useState(0);
  const [featureImportance, setFeatureImportance] = useState<Record<string, number>>({});
  const [allModelResults, setAllModelResults] = useState<PredictionResult[]>([]);
  const [formattedModelResults, setFormattedModelResults] = useState<any[]>([]);

  const handleDownloadPdf = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text("Parkinson's Insight - Assessment Report", 105, 20, { align: 'center' });

    // Date
    doc.setFontSize(10);
    doc.text(`Date of Assessment: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });

    let yPos = 45; // Initial yPos after header

    // Summary Section
    doc.setFontSize(16);
    doc.text("Assessment Summary", 14, yPos); yPos += 8;
    doc.setFontSize(12);
    doc.text(`Risk Score: ${riskScore}/100`, 14, yPos); yPos += 7;
    doc.text(`Risk Level: ${riskCategory.label}`, 14, yPos); yPos += 7;
    doc.text(`Probability of Parkinson's: ${(probability * 100).toFixed(1)}%`, 14, yPos); yPos += 7;
    doc.text(`Model Used: ${formatModelName(modelUsed)}`, 14, yPos); yPos += 7;
    doc.text(`Model Confidence: ${(confidence * 100).toFixed(1)}%`, 14, yPos); yPos += 7;
    if (state?.formData?.age) {
      doc.text(`Age at Assessment: ${state.formData.age} years`, 14, yPos); yPos += 7;
    }
    yPos += 10; // Margin after summary

    // Recommendations
    doc.setFontSize(16);
    doc.text("Recommendations", 14, yPos); yPos += 8;
    doc.setFontSize(12);
    const recommendationsText = doc.splitTextToSize(getRecommendations(), 180);
    doc.text(recommendationsText, 14, yPos);
    yPos += (recommendationsText.length * 5) + 10; // Margin after recommendations (using existing line height logic)

    // Clinical Symptoms
    if (state?.formData) {
      const symptomsData = Object.entries(state.formData)
        .filter(([key]) => key !== 'age') // Exclude age, it's in summary
        .map(([key, value]) => [
          key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
          `${value}/10`
        ]);
      
      if (symptomsData.length > 0) {
        doc.setFontSize(16); doc.text("Clinical Symptoms Reported", 14, yPos); yPos += 8;
        autoTable(doc, {
          startY: yPos,
          head: [['Symptom', 'Severity']],
          body: symptomsData,
          theme: 'striped',
          headStyles: { fillColor: [68, 102, 204] },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10; // Margin after table
      }
    }

    // Voice Features
    const voiceFeaturesTableRows = [];
    if (state?.voiceFeatures) {
      const { mdvpFo, mdvpFhi, mdvpFlo, mdvpJitter, mdvpShimmer, nhr, hnr } = state.voiceFeatures;
      if (mdvpFo !== undefined) voiceFeaturesTableRows.push(["MDVP Average (Fo)", `${mdvpFo.toFixed(2)} Hz`]);
      if (mdvpFhi !== undefined) voiceFeaturesTableRows.push(["MDVP Maximum (Fhi)", `${mdvpFhi.toFixed(2)} Hz`]);
      if (mdvpFlo !== undefined) voiceFeaturesTableRows.push(["MDVP Minimum (Flo)", `${mdvpFlo.toFixed(2)} Hz`]);
      // mdvpJitter and mdvpShimmer use || 0 in their original calculation in the UI, 
      // so they will always have a value if state.voiceFeatures exists.
      if (mdvpJitter !== undefined) voiceFeaturesTableRows.push(["MDVP Jitter (%)", `${(mdvpJitter * 100).toFixed(4)}%`]);
      else voiceFeaturesTableRows.push(["MDVP Jitter (%)", `${((0) * 100).toFixed(4)}%`]); // Default if undefined
      
      if (mdvpShimmer !== undefined) voiceFeaturesTableRows.push(["MDVP Shimmer (%)", `${(mdvpShimmer * 100).toFixed(2)}%`]);
      else voiceFeaturesTableRows.push(["MDVP Shimmer (%)", `${((0) * 100).toFixed(2)}%`]); // Default if undefined

      if (nhr !== undefined) voiceFeaturesTableRows.push(["Noise-Harmonic Ratio (NHR)", nhr.toFixed(4)]);
      if (hnr !== undefined) voiceFeaturesTableRows.push(["Harmonics-Noise Ratio (HNR)", `${hnr.toFixed(2)} dB`]);
    }

    if (voiceFeaturesTableRows.length > 0) {
      doc.setFontSize(16); doc.text("Voice Analysis Features", 14, yPos); yPos += 8;
      autoTable(doc, {
        startY: yPos,
        head: [['Feature', 'Value']],
        body: voiceFeaturesTableRows,
        theme: 'striped',
        headStyles: { fillColor: [68, 102, 204] },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10; // Margin after table
    }
    
    // Feature Importance
    if (featureImportance && Object.keys(featureImportance).length > 0) {
      doc.setFontSize(16); doc.text("Key Contributing Factors (Feature Importance)", 14, yPos); yPos += 8;
      const importanceData = Object.entries(featureImportance)
        .sort(([,a], [,b]) => b - a)
        .map(([key, value]) => [
          key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()),
          (value * 100).toFixed(1) + "%"
        ]);
      autoTable(doc, {
        startY: yPos,
        head: [['Feature', 'Importance']],
        body: importanceData,
        theme: 'striped',
        headStyles: { fillColor: [68, 102, 204] },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10; // Margin after table
    }

    // Disclaimer
    if (yPos > 260) { // Check if disclaimer needs a new page
      doc.addPage();
      yPos = 20; // Reset yPos for new page
    }
    doc.setFontSize(8);
    doc.text(
      "Disclaimer: This report is based on a preliminary assessment and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.",
      14, yPos, // Use current yPos
      { maxWidth: 180, align: 'justify' }
    );

    doc.save("Parkinson_Insight_Assessment_Report.pdf");
    toast.success("Assessment PDF downloaded.");
  };

  useEffect(() => {    
    if (!state?.formData) {
      navigate("/app/symptom-check");
      return;
    }
    
    const getResults = async () => {
      try {
        setIsLoading(true);
        
        const features: ParkinsonsFeatures = {
          ...state.formData,
          ...(state.voiceFeatures || {}),
        };
        
        const result = await enhancedMockFastApi.getPrediction(features);
        
        setRiskScore(result.riskScore);
        setProbability(result.probability);
        setStatus(result.status);
        setModelUsed('ensemble');
        setConfidence(result.confidence);
        setFeatureImportance(result.featureImportance || {});
        
        if (result.allModelResults && result.allModelResults.length > 0) {
          setAllModelResults(result.allModelResults);
          
          const formattedResults = [
            ...result.allModelResults.map(mr => ({
              modelName: mr.modelUsed,
              riskScore: mr.riskScore,
              probability: mr.probability,
              confidence: mr.confidence
            })),
            {
              modelName: 'ensemble',
              riskScore: result.riskScore,
              probability: result.probability,
              confidence: result.confidence
            }
          ];
          
          setFormattedModelResults(formattedResults);
        }
        
        if (state.formData) {
          saveAssessment(
            { ...state.formData, ...(state.voiceFeatures || {}) },
            {
              riskScore: result.riskScore,
              probability: result.probability,
              status: result.status,
              modelUsed: 'ensemble'
            },
            formattedModelResults
          );
          
          toast.success("Assessment saved to history");
        }
      } catch (error) {
        console.error("Error getting predictions:", error);
        toast.error("Failed to get prediction results. Using fallback data.");
      } finally {
        setIsLoading(false);
      }
    };
    
    getResults();
  }, [state, navigate]);
  
  const getRiskCategory = () => {
    if (riskScore < 20) return { label: "Low Risk", color: "bg-green-500" };
    if (riskScore < 50) return { label: "Moderate Risk", color: "bg-yellow-500" };
    if (riskScore < 80) return { label: "High Risk", color: "bg-orange-500" };
    return { label: "Very High Risk", color: "bg-red-500" };
  };

  const riskCategory = getRiskCategory();
  
  const getRecommendations = () => {
    if (riskScore < 20) {
      return "Based on your inputs, your symptoms do not strongly indicate Parkinson's disease. However, continue to monitor any changes in your symptoms.";
    }
    if (riskScore < 50) {
      return "Your symptoms show some patterns that could be associated with Parkinson's disease. Consider discussing these symptoms with your healthcare provider during your next visit.";
    }
    if (riskScore < 80) {
      return "Your symptoms show several patterns commonly associated with Parkinson's disease. We recommend scheduling an appointment with a neurologist for a comprehensive evaluation.";
    }
    return "Your symptoms strongly align with patterns seen in Parkinson's disease. We strongly recommend seeking prompt medical attention from a neurologist specializing in movement disorders.";
  };

  const formatModelName = (model: ModelType | 'ensemble'): string => {
    switch(model) {
      case 'gradient_boosting': return 'Gradient Boosting';
      case 'randomForest': return 'Random Forest';
      case 'neuralNetwork': return 'Neural Network';
      case 'svm': return 'Support Vector Machine';
      case 'adaboost': return 'AdaBoost';
      case 'extra_trees': return 'Extra Trees';
      case 'ensemble': return 'Ensemble Model';
      default: return model;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Analyzing your symptoms...</h2>
          <Progress className="w-64 h-2" value={undefined} />
          <p className="mt-4 text-sm text-muted-foreground">
            Processing your clinical data and voice features through our ML models
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <span className="bg-gradient-to-r from-purple-600 to-teal-500 bg-clip-text text-transparent">Assessment Results</span>
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Based on the symptoms you reported and voice analysis (if provided), here's your assessment.
        </p>
      </div>
      
      <Tabs defaultValue="summary">
        <TabsList className="grid w-full grid-cols-5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg mb-2">
          <TabsTrigger value="summary" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400">
            <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-red-500 mr-1" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400">
            <LineChart className="h-4 w-4" />
            Detailed Analysis
          </TabsTrigger>
          <TabsTrigger value="model-insights" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400">
            <Brain className="h-4 w-4" />
            Model Insights
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-teal-600 dark:data-[state=active]:text-teal-400">
            <Scale className="h-4 w-4" />
            Model Comparison
          </TabsTrigger>
          <TabsTrigger value="next-steps" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400">
            <ClipboardList className="h-4 w-4" />
            Next Steps
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="mt-4">
          <Card className="bg-gradient-to-br from-purple-100 via-white to-white dark:from-purple-900/40 dark:via-zinc-900 dark:to-zinc-900 border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-200 via-yellow-200 to-red-200 dark:from-green-900/40 dark:via-yellow-900/40 dark:to-red-900/40">
                <AlertTriangle className="h-7 w-7 text-yellow-600 dark:text-yellow-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Risk Assessment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Risk Level:</span>
                  <span className={`px-3 py-1 rounded-full text-white font-medium ${riskCategory.color} shadow-md flex items-center gap-2`}>
                    <Gauge className="h-5 w-5" />
                    {riskCategory.label}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                  <Progress value={riskScore} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-green-400 [&>div]:to-red-500 dark:[&>div]:from-green-600 dark:[&>div]:to-red-600" />
                  <div className="text-right text-sm text-muted-foreground">
                    Score: {riskScore}/100
                  </div>
                </div>
                <div className="mt-4 p-4 bg-secondary/30 rounded-md flex flex-col gap-2">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium flex items-center gap-2"><PercentCircle className="h-5 w-5 text-blue-500" /> Probability Assessment</h4>
                    <span className="font-medium">{(probability * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={probability * 100} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-blue-400 [&>div]:to-purple-500 dark:[&>div]:from-blue-600 dark:[&>div]:to-purple-600" />
                  <div className="flex justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      Estimated probability based on {formatModelName(modelUsed)}
                    </p>
                    <p className="text-xs font-medium">
                      Confidence: {(confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800 flex items-start gap-3">
                <ClipboardList className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mt-1" />
                <div>
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-1">Recommendation</h4>
                  <p className="text-zinc-700 dark:text-zinc-200 text-sm">{getRecommendations()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details" className="mt-4">
          <Card className="shadow-soft card-gradient">
            <CardHeader>
              <CardTitle>Detailed Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Clinical Symptoms</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Tremor/Shaking:</span>
                      <span className="font-medium">{state?.formData?.tremor}/10</span>
                    </div>
                    <Progress value={state?.formData?.tremor ? (state.formData.tremor * 10) : 0} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Muscle Rigidity:</span>
                      <span className="font-medium">{state?.formData?.rigidity}/10</span>
                    </div>
                    <Progress value={state?.formData?.rigidity ? (state.formData.rigidity * 10) : 0} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Slowness of Movement:</span>
                      <span className="font-medium">{state?.formData?.bradykinesia}/10</span>
                    </div>
                    <Progress value={state?.formData?.bradykinesia ? (state.formData.bradykinesia * 10) : 0} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Balance Problems:</span>
                      <span className="font-medium">{state?.formData?.posturalInstability}/10</span>
                    </div>
                    <Progress value={state?.formData?.posturalInstability ? (state.formData.posturalInstability * 10) : 0} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Voice Changes:</span>
                      <span className="font-medium">{state?.formData?.voiceChanges}/10</span>
                    </div>
                    <Progress value={state?.formData?.voiceChanges ? (state.formData.voiceChanges * 10) : 0} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Small Handwriting:</span>
                      <span className="font-medium">{state?.formData?.handwriting}/10</span>
                    </div>
                    <Progress value={state?.formData?.handwriting ? (state.formData.handwriting * 10) : 0} className="h-2" />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {state?.voiceFeatures && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Voice Analysis</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-md font-medium mb-3">MDVP Frequency Measurements</h4>
                      <ul className="space-y-3">
                        <li className="flex justify-between">
                          <span>Average (Fo):</span> 
                          <span className="font-mono">{state.voiceFeatures.mdvpFo?.toFixed(2)} Hz</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Maximum (Fhi):</span> 
                          <span className="font-mono">{state.voiceFeatures.mdvpFhi?.toFixed(2)} Hz</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Minimum (Flo):</span> 
                          <span className="font-mono">{state.voiceFeatures.mdvpFlo?.toFixed(2)} Hz</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium mb-3">Voice Quality Measures</h4>
                      <ul className="space-y-3">
                        <li className="flex justify-between">
                          <span>Jitter (%):</span> 
                          <span className="font-mono">{((state.voiceFeatures.mdvpJitter || 0) * 100).toFixed(4)}%</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Shimmer (%):</span> 
                          <span className="font-mono">{((state.voiceFeatures.mdvpShimmer || 0) * 100).toFixed(2)}%</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Noise-Harmonic Ratio:</span> 
                          <span className="font-mono">{state.voiceFeatures.nhr?.toFixed(4)}</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Harmonics-Noise Ratio:</span> 
                          <span className="font-mono">{state.voiceFeatures.hnr?.toFixed(2)} dB</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>
                      Voice analysis is a key biomarker for early Parkinson's detection. Research shows
                      that changes in phonation, particularly increased jitter and shimmer values,
                      can indicate neurological changes years before motor symptoms appear.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="model-insights" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FeatureImportance featureImportance={featureImportance} />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ML Model Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Model Used:</span>
                    <span className="font-medium">{formatModelName(modelUsed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Model Confidence:</span>
                    <span className="font-medium">{(confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Risk Score:</span>
                    <span className="font-medium">{riskScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">PD Probability:</span>
                    <span className="font-medium">{(probability * 100).toFixed(1)}%</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-medium">About this model</h4>
                  <p className="text-sm text-muted-foreground">
                    Ensemble combines predictions from all models, weighted by their confidence levels, typically 
                    providing more robust and accurate predictions than any single model. This approach reduces bias and 
                    variance that might be present in individual models.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {allModelResults.length > 0 && (
            <ModelComparison modelResults={allModelResults} />
          )}
        </TabsContent>

        <TabsContent value="comparison" className="mt-4">
          <Card className="shadow-soft card-gradient">
            <CardHeader>
              <CardTitle>Model Comparison Insights</CardTitle>
            </CardHeader>
            <CardContent className="h-[450px] p-4">
              {formattedModelResults.length > 0 ? (
                <ModelComparisonChart modelResults={formattedModelResults} />
              ) : (
                <p>Model comparison data is not available for this assessment.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="next-steps" className="mt-4 space-y-4">
          <Card className="shadow-soft card-gradient">
            <CardHeader>
              <CardTitle>Recommended Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {status === 1 ? ( // Assuming status === 1 indicates higher likelihood/need for action
                  <>
                    <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                      <div className="bg-red-100 dark:bg-red-800 p-2 rounded-full mt-1">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-red-800 dark:text-red-200">Consult a Neurologist</h3>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                          Your assessment indicates patterns that may be consistent with Parkinson's disease. 
                          It is crucial to schedule an appointment with a neurologist, preferably one 
                          specializing in movement disorders, for a comprehensive evaluation and diagnosis.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                      <div className="bg-orange-100 dark:bg-orange-800 p-2 rounded-full mt-1">
                        <ClipboardList className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-orange-800 dark:text-orange-200">Keep a Detailed Symptom Journal</h3>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                          Start documenting any symptoms you experience, their frequency, severity, and when they occur. 
                          Note any changes or patterns. This information will be very helpful for your doctor.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                      <div className="bg-yellow-100 dark:bg-yellow-800 p-2 rounded-full mt-1">
                        <Brain className="h-5 w-5 text-yellow-600 dark:text-yellow-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Lifestyle Adjustments & Self-Care</h3>
                        <ul className="list-disc list-inside text-sm text-zinc-700 dark:text-zinc-300 space-y-1 mt-1">
                          <li><strong>Exercise:</strong> Engage in regular physical activity. Focus on exercises that improve balance, flexibility, and cardiovascular health (e.g., walking, swimming, Tai Chi, yoga).</li>
                          <li><strong>Diet:</strong> Maintain a balanced diet rich in antioxidants (fruits, vegetables), fiber, and lean protein. Stay well-hydrated.</li>
                          <li><strong>Stress Management:</strong> Practice stress-reducing activities like mindfulness, meditation, or engaging in hobbies.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-lg">
                       <div className="bg-teal-100 dark:bg-teal-800 p-2 rounded-full mt-1">
                        <Scale className="h-5 w-5 text-teal-600 dark:text-teal-300" /> {/* Placeholder icon, consider changing */}
                      </div>
                      <div>
                        <h3 className="font-semibold text-teal-800 dark:text-teal-200">Seek Support</h3>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                          Connect with local or online Parkinson's support groups. Sharing experiences and information can be very beneficial. Consider talking to a counselor if you feel overwhelmed.
                        </p>
                      </div>
                    </div>
                  </>
                ) : ( // Lower risk
                  <>
                    <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                      <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full mt-1">
                        <LineChart className="h-5 w-5 text-green-600 dark:text-green-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-800 dark:text-green-200">Continue Monitoring Symptoms</h3>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                          While your current assessment doesn't indicate a high risk, it's wise to continue 
                          monitoring for any new or changing symptoms over time.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                      <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full mt-1">
                        <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-800 dark:text-blue-200">Maintain Regular Check-ups</h3>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300">
                          Continue with regular check-ups with your primary care physician. Discuss any concerns or observed
                          symptom changes during these visits.
                        </p>
                      </div>
                    </div>
                     <div className="flex items-start gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg">
                      <div className="bg-indigo-100 dark:bg-indigo-800 p-2 rounded-full mt-1">
                        <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-indigo-800 dark:text-indigo-200">Adopt a Healthy Lifestyle</h3>
                         <ul className="list-disc list-inside text-sm text-zinc-700 dark:text-zinc-300 space-y-1 mt-1">
                          <li><strong>Stay Active:</strong> Regular physical activity is beneficial for overall health and can help maintain mobility and balance.</li>
                          <li><strong>Balanced Diet:</strong> Eat a nutritious diet with plenty of fruits, vegetables, and whole grains. Ensure adequate hydration.</li>
                          <li><strong>Manage Stress:</strong> Incorporate stress-reduction techniques into your routine.</li>
                        </ul>
                      </div>
                    </div>
                  </>
                )}
                
                {/* This section is general and applies to all users */}
                <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
                  <div className="bg-purple-100 dark:bg-purple-800 p-2 rounded-full mt-1">
                    <Gauge className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-800 dark:text-purple-200">General Lifestyle Recommendations</h3>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">
                      Regardless of your current assessment, maintaining a healthy lifestyle is key. 
                      Regular exercise, a balanced diet, adequate sleep, and managing stress contribute 
                      significantly to overall well-being and can help mitigate potential future health issues.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg mt-6">
                <h4 className="font-medium mb-2 text-zinc-800 dark:text-zinc-200">Take This Assessment With You</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  You can download this assessment report as a PDF to share and discuss with your healthcare provider.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full bg-white dark:bg-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-600 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200"
                  onClick={handleDownloadPdf}
                >
                  Download Assessment PDF
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li>
                  <a href="/resources" className="text-primary hover:underline flex justify-between items-center group">
                    <span>Educational Materials on Parkinson's Disease</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  </a>
                  <p className="text-xs text-muted-foreground mt-0.5">Learn more about symptoms, treatment options, and research from our curated resources.</p>
                </li>
                <li>
                  <a href="https://www.parkinson.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex justify-between items-center group">
                    <span>Parkinson's Foundation</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  </a>
                  <p className="text-xs text-muted-foreground mt-0.5">A national organization focused on research, education, and support for those affected by Parkinson's.</p>
                </li>
                <li>
                  <a href="https://www.michaeljfox.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex justify-between items-center group">
                    <span>The Michael J. Fox Foundation for Parkinson's Research</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  </a>
                   <p className="text-xs text-muted-foreground mt-0.5">Dedicated to finding a cure for Parkinson's disease through an aggressively funded research agenda.</p>
                </li>
                 <li>
                  <a href="https://www.apdaparkinson.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex justify-between items-center group">
                    <span>American Parkinson Disease Association (APDA)</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">→</span>
                  </a>
                  <p className="text-xs text-muted-foreground mt-0.5">Provides support, education, and research to help everyone impacted by Parkinson's live life to the fullest.</p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={() => navigate("/symptom-checker")}
          className="flex-1"
        >
          Retake Assessment
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate("/history")}
          className="flex-1"
        >
          View History
        </Button>
      </div>
    </div>
  );
};

export default Results;
