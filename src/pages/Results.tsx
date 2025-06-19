import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState, useContext } from "react";
import { 
  ParkinsonsFeatures, 
  ModelType, 
  PredictionResult
} from "@/types";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { saveAssessment } from "@/utils/assessmentHistory";
import { UserContext } from "@/App";
import FeatureImportance from "@/components/FeatureImportance";
import ModelComparison from "@/components/ModelComparison";
import { VoiceAnalysisChart } from "@/components/VoiceAnalysisChart";
import VoiceFeatures from "@/components/VoiceFeatures";
import { toast } from "sonner";
import { 
  AlertTriangle, 
  Gauge, 
  LineChart, 
  PercentCircle, 
  ClipboardList, 
  Brain, 
  Scale, 
  Activity,
  Download,
  Share,
  Home,
  BarChart4,
  FileText,
  ArrowLeft,
  ChevronRight,
  Info,
  CheckCircle,
  XCircle,
  HelpCircle,
  Mic
} from "lucide-react";
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { ClinicalAssessmentResponse, apiService, CompleteVoiceData } from "@/services/api";
import { Badge } from "@/components/ui/badge";

interface ResultsState {
  formData?: {
    tremor: boolean;
    rigidity: boolean;
    bradykinesia: boolean;
    posturalInstability: boolean;
    voiceChanges: boolean;
    handwriting: boolean;
    age: number;
  };
  voiceFeatures?: Partial<ParkinsonsFeatures>;
  selectedModel?: ModelType | 'ensemble';
  clinicalAssessment?: ClinicalAssessmentResponse;
  hasVoiceData?: boolean;
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const state = location.state as ResultsState | undefined;
  const [riskScore, setRiskScore] = useState<number>(0);
  const [probability, setProbability] = useState<number>(0);
  const [status, setStatus] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [modelUsed, setModelUsed] = useState<ModelType | 'ensemble'>('ensemble');
  const [confidence, setConfidence] = useState<number>(0);
  const [featureImportance, setFeatureImportance] = useState<Record<string, number>>({});
  const [allModelResults, setAllModelResults] = useState<PredictionResult[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  const [reportPdf, setReportPdf] = useState<jsPDF | null>(null);
  const [activeTab, setActiveTab] = useState("summary");

  useEffect(() => {
    // Redirect to home if no state is provided
    if (!state || !state.formData) {
      navigate('/');
      return;
    }

    // Get prediction results
    const getResults = async () => {
      setIsLoading(true);
        try {        // If we have clinical assessment results, use those
        if (state.clinicalAssessment) {
          const { prediction, probability, risk_score } = state.clinicalAssessment;
          console.log("Results.tsx - Raw clinical assessment data:", { prediction, probability, risk_score });
          
          // Clinical assessment uses a simple scale
          setRiskScore(isNaN(risk_score) ? 0 : risk_score);
          setProbability(isNaN(probability) ? 0 : probability);
          setStatus(isNaN(prediction) ? 0 : prediction);
          setConfidence(isNaN(probability) ? 0 : probability); // Use probability as confidence
          
          // Generate default recommendations based on risk score
          const defaultRecommendations = [
            "Maintain a balanced diet rich in antioxidants, healthy fats, and proteins.",
            "Engage in regular exercise, particularly activities that improve balance and coordination.",
            "Practice stress management techniques such as meditation or yoga.",
            "Consider scheduling regular check-ups with a neurologist.",
            "Discuss any concerns about your movement health with your primary care physician."
          ];
          
          setRecommendations(defaultRecommendations);
          
          // Use feature importance from API if available, otherwise calculate based on symptom values
          if (state.clinicalAssessment.feature_importance) {
            setFeatureImportance(state.clinicalAssessment.feature_importance);
          } else {
            // Calculate relative feature importance from form data (no mock data)
            const { tremor, rigidity, bradykinesia, posturalInstability, voiceChanges, handwriting } = state.formData || {};
            const symptoms = { tremor, rigidity, bradykinesia, posturalInstability, voiceChanges, handwriting };
            
            // Convert boolean symptoms to feature importance values based on clinical weights
            const symptomsToImportance = Object.fromEntries(
              Object.entries(symptoms)
                .filter(([key, value]) => value) // Only include symptoms that are present
                .map(([key, value]) => [key, key === 'bradykinesia' || key === 'tremor' ? 0.25 : 0.12])
            );
            
            setFeatureImportance(symptomsToImportance);
          }          // For clinical assessment, create a single model result based on the assessment
          const clinicalModelResult = {
            modelName: 'clinical_assessment',
            riskScore: isNaN(risk_score) ? 0 : risk_score,
            probability: isNaN(probability) ? 0 : probability,
            confidence: isNaN(probability) ? 0 : probability,
            status: isNaN(prediction) ? 0 : prediction,
            modelUsed: 'clinical_assessment'
          } as unknown as PredictionResult;
          
          console.log("Results.tsx - Raw values:", { risk_score, probability, prediction });
          console.log("Results.tsx - Processed values:", { 
            riskScore: clinicalModelResult.riskScore, 
            probability: clinicalModelResult.probability, 
            confidence: clinicalModelResult.confidence 
          });
          console.log("Results.tsx - Setting clinical model result:", clinicalModelResult);
          setAllModelResults([clinicalModelResult]);
          
          // Save clinical assessment to Firebase
          if (state.formData) {
            const features = {
              mdvpFo: 0, // Clinical assessments don't have voice features
              mdvpFhi: 0,
              mdvpFlo: 0,
              mdvpJitter: 0,
              mdvpJitterAbs: 0,
              mdvpRap: 0,
              mdvpPpq: 0,
              jitterDdp: 0,
              mdvpShimmer: 0,
              mdvpShimmerDb: 0,
              shimmerApq3: 0,
              shimmerApq5: 0,
              mdvpApu: 0,
              shimmerDda: 0,
              nhr: 0,
              hnr: 0,
              rpde: 0,
              dfa: 0,
              spread1: 0,
              spread2: 0,
              d2: 0,
              ppe: 0,
              // Add clinical symptoms as features
              tremor: state.formData.tremor ? 1 : 0,
              rigidity: state.formData.rigidity ? 1 : 0,
              bradykinesia: state.formData.bradykinesia ? 1 : 0,
              posturalInstability: state.formData.posturalInstability ? 1 : 0,
              voiceChanges: state.formData.voiceChanges ? 1 : 0,
              handwriting: state.formData.handwriting ? 1 : 0
            };
            
            const saveResult = {
              riskScore: isNaN(risk_score) ? 0 : risk_score,
              probability: isNaN(probability) ? 0 : probability,
              status: isNaN(prediction) ? 0 : prediction,
              modelUsed: 'clinical_assessment'
            };
            
            const allModelResultsForSave = [{
              modelName: 'clinical_assessment',
              riskScore: isNaN(risk_score) ? 0 : risk_score,
              probability: isNaN(probability) ? 0 : probability,
              confidence: isNaN(probability) ? 0 : probability
            }];
            
            console.log("Results.tsx - Saving clinical assessment for user:", user?.id);
            console.log("Results.tsx - Clinical assessment data:", { features, saveResult, allModelResultsForSave });
            
            try {
              await saveAssessment(features, saveResult, allModelResultsForSave, user?.id);
              console.log("Results.tsx - Clinical assessment saved successfully");
              toast.success("Assessment saved successfully!");
            } catch (error) {
              console.error("Results.tsx - Error saving clinical assessment:", error);
              toast.error("Failed to save assessment. Please try again.");
            }
          }
          
          setIsLoading(false);
        } else {
          // Get prediction from ML model
          const features: ParkinsonsFeatures = {
            tremor: state.formData.tremor ? 6 : 0,
            rigidity: state.formData.rigidity ? 6 : 0,
            bradykinesia: state.formData.bradykinesia ? 6 : 0,
            posturalInstability: state.formData.posturalInstability ? 6 : 0,
            voiceChanges: state.formData.voiceChanges ? 6 : 0,
            handwriting: state.formData.handwriting ? 6 : 0,
            age: state.formData.age,
            ...(state.voiceFeatures || {}),
          };
          
          try {
            // Convert features to CompleteVoiceData for API
            const voiceData: CompleteVoiceData = {
              MDVP_Fo: features.mdvpFo || 0,
              MDVP_Fhi: features.mdvpFhi || 0,
              MDVP_Flo: features.mdvpFlo || 0,
              MDVP_Jitter: features.mdvpJitter || 0,
              MDVP_Jitter_Abs: 0,
              MDVP_RAP: 0,
              MDVP_PPQ: 0,
              Jitter_DDP: 0,
              MDVP_Shimmer: features.mdvpShimmer || 0,
              MDVP_Shimmer_dB: 0,
              Shimmer_APQ3: 0,
              Shimmer_APQ5: 0,
              MDVP_APQ: 0,
              Shimmer_DDA: 0,
              NHR: features.nhr || 0,
              HNR: features.hnr || 0,
              RPDE: features.rpde || 0,
              DFA: features.dfa || 0,
              spread1: features.spread1 || 0,
              spread2: features.spread2 || 0,
              D2: features.d2 || 0,
              PPE: features.ppe || 0
            };
            
            // Use the real API service
            const multiModelResult = await apiService.predictWithAllModels(voiceData);
            
            // Get ensemble model result
            const ensembleResult = multiModelResult.models['ensemble'];
            
            setRiskScore(ensembleResult.risk_score);
            setProbability(ensembleResult.probability);
            setStatus(ensembleResult.prediction);
            setModelUsed('ensemble');
            setConfidence(ensembleResult.confidence);
            setFeatureImportance(multiModelResult.feature_importance || {});
            
            // Get all model results for comparison first
            let allModelResultsForSave: any[] = [];
            if (multiModelResult && multiModelResult.models) {
              // Convert the model results to the format expected by the UI
              const modelResults = Object.entries(multiModelResult.models).map(([modelName, result]) => {
                return {
                  modelName,
                  riskScore: result.risk_score,
                  probability: result.probability,
                  confidence: result.confidence,
                  status: result.prediction,
                  modelUsed: modelName
                } as unknown as PredictionResult;
              });
              
              console.log("Results.tsx - Setting voice analysis model results:", modelResults);
              setAllModelResults(modelResults);
              
              // Convert to format expected by saveAssessment
              allModelResultsForSave = modelResults.map(result => ({
                modelName: result.modelName,
                riskScore: result.riskScore,
                probability: result.probability,
                confidence: result.confidence
              }));
            }
            
            // Save assessment with correct parameters including user ID
            const saveResult = {
              riskScore: ensembleResult.risk_score,
              probability: ensembleResult.probability,
              status: ensembleResult.prediction,
              modelUsed: modelUsed.toString()
            };
            
            console.log("Results.tsx - Saving assessment for user:", user?.id);
            console.log("Results.tsx - Assessment data:", { features, saveResult, allModelResultsForSave });
            
            try {
              await saveAssessment(features, saveResult, allModelResultsForSave, user?.id);
              console.log("Results.tsx - Assessment saved successfully");
              toast.success("Assessment saved successfully!");
            } catch (error) {
              console.error("Results.tsx - Error saving assessment:", error);
              toast.error("Failed to save assessment. Please try again.");
            }
            
            setIsLoading(false);
          } catch (error) {
            console.error("Error getting model predictions:", error);
            toast.error("Could not get prediction results. Please try again.");
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Error in results processing:", error);
        toast.error("Failed to process results. Please try again.");
        setIsLoading(false);
      }
    };
  
    getResults();
  }, [state, navigate, modelUsed]);

  const getRiskCategory = () => {
    const score = isNaN(riskScore) ? 0 : riskScore;
    if (score < 20) return { label: "Low Risk", color: "bg-green-500", textColor: "text-green-600 dark:text-green-400", bgColor: "bg-green-50 dark:bg-green-900/20" };
    if (score < 50) return { label: "Moderate Risk", color: "bg-yellow-500", textColor: "text-yellow-600 dark:text-yellow-400", bgColor: "bg-yellow-50 dark:bg-yellow-900/20" };
    if (score < 80) return { label: "High Risk", color: "bg-orange-500", textColor: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-50 dark:bg-orange-900/20" };
    return { label: "Very High Risk", color: "bg-red-500", textColor: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 dark:bg-red-900/20" };
  };

  const getRecommendations = () => {
    if (recommendations.length > 0) return recommendations;
    
    const safeRiskScore = isNaN(riskScore) ? 0 : riskScore;
    
    if (safeRiskScore < 20) {
      return ["Continue regular check-ups with your healthcare provider", "Stay physically active with regular exercise", "Maintain a balanced diet rich in antioxidants"];
    }
    if (safeRiskScore < 50) {
      return ["Schedule a consultation with a neurologist", "Consider dopamine-specific testing", "Increase physical activity with targeted exercises", "Monitor symptoms and keep a symptom diary"];
    }
    if (safeRiskScore < 80) {
      return ["Seek immediate consultation with a movement disorder specialist", "Begin comprehensive neurological testing", "Consider dopamine replacement therapy evaluation", "Join a Parkinson's support group"];
    }
    
    return ["Urgent consultation with a movement disorder specialist is recommended", "Comprehensive neurological assessment needed", "Begin discussion about treatment options including medication", "Consider physical and occupational therapy", "Connect with a Parkinson's disease support network"];
  };

  // Function to generate recommendations based on risk score and prediction
  const generateRecommendations = (riskScore: number, prediction: number): string[] => {
    const recommendations: string[] = [];
    
    // Ensure we have safe values
    const safeRiskScore = isNaN(riskScore) ? 0 : riskScore;
    const safePrediction = isNaN(prediction) ? 0 : prediction;
    
    // Low risk general recommendations (always include)
    recommendations.push("Maintain a balanced diet rich in antioxidants, healthy fats, and proteins.");
    recommendations.push("Engage in regular exercise, particularly activities that improve balance and coordination.");
    recommendations.push("Practice stress management techniques such as meditation or yoga.");
    
    // Medium risk recommendations
    if (safeRiskScore > 30) {
      recommendations.push("Consider scheduling regular check-ups with a neurologist (every 6-12 months).");
      recommendations.push("Keep a symptom journal to track any changes in motor function or overall wellbeing.");
      recommendations.push("Incorporate flexibility exercises and stretching into your daily routine.");
    }
    
    // Higher risk recommendations
    if (safeRiskScore > 50) {
      recommendations.push("Schedule a comprehensive neurological evaluation as soon as possible.");
      recommendations.push("Ask your doctor about appropriate screening tests for Parkinson's Disease.");
      recommendations.push("Consider joining a support group for individuals with movement disorders.");
    }
    
    // Additional recommendations for positive prediction
    if (safePrediction === 1) {
      recommendations.push("Discuss the results of this assessment with a healthcare professional promptly.");
      recommendations.push("Learn more about the early signs and symptoms of Parkinson's Disease from trusted medical sources.");
    }
    
    return recommendations;
  };

  // Generate a downloadable PDF report
  const generateReport = () => {
    const doc = new jsPDF();
    const riskCat = getRiskCategory();
    
    // Title
    doc.setFontSize(22);
    doc.setTextColor(44, 62, 80);
    doc.text("Parkinson's Disease Risk Assessment", 15, 20);

    // Timestamp and ID
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    const timestamp = new Date().toLocaleString();
    const reportId = `PD-${Date.now().toString(36).slice(-6).toUpperCase()}`;
    doc.text(`Report Generated: ${timestamp} | ID: ${reportId}`, 15, 28);
    
    doc.line(15, 30, 195, 30);
    
    // Patient Info
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.text("Assessment Summary", 15, 38);

    // Risk Score - Check for NaN values
    doc.setFontSize(16);
    doc.text(`Risk Score: ${isNaN(riskScore) ? "0" : Math.round(riskScore)}`, 15, 50);
    
    // Risk Category
    doc.setFontSize(14);
    switch (riskCat.label) {
      case "Low Risk":
        doc.setTextColor(39, 174, 96);
        break;
      case "Moderate Risk":
        doc.setTextColor(241, 196, 15);
        break;
      case "High Risk":
        doc.setTextColor(230, 126, 34);
        break;
      case "Very High Risk":
        doc.setTextColor(231, 76, 60);
        break;
    }
    doc.text(`Risk Category: ${riskCat.label}`, 15, 58);
    
    // Confidence 
    doc.setFontSize(12);
    doc.setTextColor(44, 62, 80);
    doc.text(`Confidence: ${isNaN(confidence) ? "0" : Math.round(confidence * 100)}%`, 15, 66);
    
    // Model Used
    doc.text(`Model Used: ${modelUsed}`, 15, 74);
    
    doc.line(15, 80, 195, 80);
    
    // Symptoms Section
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text("Reported Symptoms", 15, 90);
    
    // Create symptoms table
    const symptomsData = [];
    if (state && state.formData) {
      if (state.formData.tremor) symptomsData.push(["Tremor", "Present"]);
      if (state.formData.rigidity) symptomsData.push(["Rigidity", "Present"]);
      if (state.formData.bradykinesia) symptomsData.push(["Bradykinesia", "Present"]);
      if (state.formData.posturalInstability) symptomsData.push(["Postural Instability", "Present"]);
      if (state.formData.voiceChanges) symptomsData.push(["Voice Changes", "Present"]);
      if (state.formData.handwriting) symptomsData.push(["Handwriting Changes", "Present"]);
      
      // Add age
      symptomsData.push(["Age", state.formData.age.toString()]);
    }
    
    // If no symptoms were reported
    if (symptomsData.length === 0 || (symptomsData.length === 1 && symptomsData[0][0] === "Age")) {
      symptomsData.push(["No clinical symptoms reported", ""]);
    }
    
    autoTable(doc, {
      startY: 95,
      head: [['Symptom', 'Status']],
      body: symptomsData,
      theme: 'striped',
      headStyles: { fillColor: [100, 116, 139] },
      styles: { fontSize: 10 }
    });
    
    // Recommendations Section
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text("Recommendations", 15, finalY);
    
    // Add recommendations
    const recList = getRecommendations();
    let yPos = finalY + 10;
    
    doc.setFontSize(10);
    recList.forEach((rec, index) => {
      doc.text(`${index + 1}. ${rec}`, 15, yPos);
      yPos += 7;
      
      // Add new page if needed
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    // Disclaimer
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.line(15, yPos, 195, yPos);
    yPos += 10;
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("DISCLAIMER", 15, yPos);
    yPos += 5;
    doc.text("This assessment is not a medical diagnosis. The results should be discussed with a healthcare", 15, yPos);
    yPos += 5;
    doc.text("professional. This tool is designed to help identify potential risk factors, not to replace medical advice.", 15, yPos);
    
    // Save the PDF
    setReportPdf(doc);
    
    // Download the PDF
    doc.save(`parkinsons-assessment-${reportId}.pdf`);
    
    toast.success("Report generated successfully", {
      description: "Your assessment report has been downloaded."
    });
  };

  // Symptom descriptions for tooltips
  const symptomDescriptions: Record<string, { description: string, significance: string, details: string }> = {
    tremor: {
      description: "Involuntary shaking that occurs at rest",
      significance: "A classic early sign of Parkinson's disease, affecting about 70% of patients",
      details: "Typically begins in one hand, finger, or thumb and occurs when the body part is relaxed (resting tremor). Often described as 'pill-rolling' because it looks like rolling a pill between thumb and forefinger."
    },
    rigidity: {
      description: "Increased muscle tone causing stiffness in limbs and trunk",
      significance: "Makes movement difficult and can cause pain or cramping",
      details: "Presents as resistance to passive movement throughout the range of motion. Can be 'cogwheel' rigidity (ratchet-like) or 'lead-pipe' rigidity (constant). Often contributes to reduced arm swing while walking."
    },
    bradykinesia: {
      description: "Slowness of movement and difficulty initiating movement",
      significance: "A core feature of Parkinson's that affects daily activities like walking and dressing",
      details: "Includes reduced spontaneous movements, decreased blinking, masked facial expression (hypomimia), and difficulty with fine motor tasks. May start with slowed performance of routine activities and progresses to difficulty initiating movements."
    },
    posturalInstability: {
      description: "Difficulty maintaining balance and coordination",
      significance: "Increases fall risk and usually appears in later stages of the disease",
      details: "Results in a stooped posture, shuffling gait, and tendency to fall backward (retropulsion). The 'pull test' is used clinically to assess this symptom - the patient is pulled backward and inability to recover balance indicates posture instability."
    },
    voiceChanges: {
      description: "Changes in speech volume, clarity, or tone",
      significance: "Often an early but overlooked symptom of Parkinson's disease",
      details: "Characterized by soft speech (hypophonia), monotone voice (loss of inflection), rapid speech, and sometimes stuttering. Voice analysis can detect subtle changes in speech patterns before other symptoms become apparent."
    },
    handwriting: {
      description: "Micrographia (small handwriting) or tremulous writing",
      significance: "A very specific indicator of Parkinson's disease that may appear years before diagnosis",
      details: "Handwriting becomes smaller and more crowded as writing progresses across the page. This symptom may be one of the earliest manifestations of Parkinson's disease, sometimes appearing years before diagnosis."
    }
  };

  // Format the symptom name for display
  const formatSymptomName = (name: string): string => {
    switch (name) {
      case "tremor": return "Tremor";
      case "rigidity": return "Rigidity";
      case "bradykinesia": return "Bradykinesia";
      case "posturalInstability": return "Postural Instability";
      case "voiceChanges": return "Voice Changes";
      case "handwriting": return "Handwriting Changes";
      default: return name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1').trim();
    }
  };
  
  // Get symptom description
  const getSymptomDescription = (name: string): { description: string, significance: string } => {
    return symptomDescriptions[name] || {
      description: "A clinical symptom related to movement disorders",
      significance: "May contribute to the overall assessment of Parkinson's disease risk"
    };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center">
              <div className="relative mx-auto mb-4">
                <div className="h-16 w-16 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 dark:border-t-indigo-400 animate-spin"></div>
              </div>
              <h3 className="text-xl font-medium mb-2">Processing Your Results</h3>
              <p className="text-muted-foreground">Please wait while we analyze your assessment data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const riskCat = getRiskCategory();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Assessment Results
            </h1>
            <p className="text-muted-foreground mt-1">
              Detailed analysis of your Parkinson's disease risk assessment
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => navigate('/app/symptom-check')}
              className="flex items-center gap-2 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
            >
              <ArrowLeft className="h-4 w-4" />
              New Assessment
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
            >
              <Home className="h-4 w-4" />
              Home
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Risk Score Card */}
            <Card className="border-0 shadow-md overflow-hidden bg-gradient-to-br from-white to-indigo-50 dark:from-gray-900 dark:to-indigo-950/30">
              <CardHeader className="pb-2 border-b border-indigo-100 dark:border-indigo-900/30">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {/* Risk Score */}
                  <div className="flex flex-col items-center justify-center p-4">
                    <div className="relative mb-2">
                      <svg className="w-32 h-32" viewBox="0 0 100 100">
                        <circle 
                          className="text-gray-200 dark:text-gray-800" 
                          strokeWidth="8" 
                          stroke="currentColor" 
                          fill="transparent" 
                          r="40" 
                          cx="50" 
                          cy="50" 
                        />
                        <circle 
                          className={`${riskCat.color} transition-all duration-1000 ease-in-out`} 
                          strokeWidth="8" 
                          strokeDasharray={`${Math.min(riskScore, 100) * 2.51} 251`}
                          strokeLinecap="round" 
                          stroke="currentColor" 
                          fill="transparent" 
                          r="40" 
                          cx="50" 
                          cy="50" 
                          transform="rotate(-90 50 50)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-3xl font-bold">{Math.round(riskScore)}</span>
                        <span className="text-xs text-muted-foreground">Risk Score</span>
                      </div>
                    </div>
                    <Badge className={`${riskCat.bgColor} ${riskCat.textColor} border-0 px-3 py-1 text-sm font-medium`}>
                      {riskCat.label}
                    </Badge>
                  </div>

                  <Separator />

                  {/* Additional Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border">
                      <div className="text-xs text-muted-foreground mb-1">Probability</div>
                      <div className="text-xl font-semibold">{Math.round(probability * 100)}%</div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border">
                      <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                      <div className="text-xl font-semibold">{Math.round(confidence * 100)}%</div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border">
                    <div className="text-xs text-muted-foreground mb-1">Prediction</div>
                    <div className="flex items-center gap-2">
                      {status === 1 ? (
                        <>
                          <div className="text-lg font-semibold text-red-600 dark:text-red-400">Positive</div>
                          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </>
                      ) : (
                        <>
                          <div className="text-lg font-semibold text-green-600 dark:text-green-400">Negative</div>
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border">
                    <div className="text-xs text-muted-foreground mb-1">Model Used</div>
                    <div className="text-base font-medium">{modelUsed.charAt(0).toUpperCase() + modelUsed.slice(1)}</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-indigo-50/50 dark:bg-indigo-950/20 border-t border-indigo-100 dark:border-indigo-900/30 p-3">
                <div className="flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300">
                  <Info className="h-3.5 w-3.5" />
                  <span>Risk scores above 50 indicate higher concern</span>
                </div>
              </CardFooter>
            </Card>

            {/* Actions Card */}
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="pb-2 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <Button 
                    onClick={generateReport} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF Report
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share with Doctor
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/app/history')}
                    className="w-full border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    View Assessment History
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Disclaimer Card */}
            <Card className="border-0 shadow-md overflow-hidden bg-gradient-to-br from-white to-yellow-50 dark:from-gray-900 dark:to-yellow-950/30">
              <CardHeader className="pb-2 border-b border-yellow-100 dark:border-yellow-900/30">
                <CardTitle className="text-lg flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  Important Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 text-sm">
                  <p className="text-yellow-800 dark:text-yellow-300">
                    This assessment is not a medical diagnosis. The results should be discussed with a healthcare professional.
                  </p>
                  <p className="text-yellow-700/80 dark:text-yellow-400/80">
                    This tool is designed to help identify potential risk factors, not to replace medical advice or clinical evaluation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Detailed Results */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-b">
                <CardTitle className="text-xl">
                  Detailed Assessment Results
                </CardTitle>
                <CardDescription>
                  Comprehensive analysis of your Parkinson's disease risk factors
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full rounded-none h-12 bg-gray-50 dark:bg-gray-900/50 border-b">
                    <TabsTrigger 
                      value="summary" 
                      className="flex-1 h-12 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-none"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Summary
                    </TabsTrigger>
                    <TabsTrigger 
                      value="symptoms" 
                      className="flex-1 h-12 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-none"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Symptoms
                    </TabsTrigger>
                    <TabsTrigger 
                      value="models" 
                      className="flex-1 h-12 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-none"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Models
                    </TabsTrigger>
                    <TabsTrigger 
                      value="features" 
                      className="flex-1 h-12 data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 rounded-none"
                    >
                      <BarChart4 className="h-4 w-4 mr-2" />
                      Features
                    </TabsTrigger>
                  </TabsList>

                  {/* Summary Tab */}
                  <TabsContent value="summary" className="p-6 focus:outline-none">
                    <div className="space-y-6">
                      {/* Assessment Overview */}
                      <div>
                        <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                          <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          Assessment Overview
                        </h3>
                        <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                            Based on your assessment, you have a <span className={`font-medium ${riskCat.textColor}`}>{riskCat.label.toLowerCase()}</span> of 
                            Parkinson's disease. The AI model has assigned a risk score of <span className="font-medium">{Math.round(riskScore)}</span> with 
                            a confidence level of <span className="font-medium">{Math.round(confidence * 100)}%</span>.
                          </p>
                          
                          {status === 1 ? (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg p-3 flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-red-800 dark:text-red-300 mb-1">Positive Prediction</p>
                                <p className="text-sm text-red-700 dark:text-red-400">
                                  The model predicts a positive indication for Parkinson's disease risk factors. 
                                  It's recommended to consult with a healthcare professional for further evaluation.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-lg p-3 flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-green-800 dark:text-green-300 mb-1">Negative Prediction</p>
                                <p className="text-sm text-green-700 dark:text-green-400">
                                  The model predicts a negative indication for Parkinson's disease risk factors. 
                                  Continue with regular health check-ups and monitoring.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Recommendations */}
                      <div>
                        <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                          <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          Recommendations
                        </h3>
                        <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
                          <ul className="space-y-3">
                            {getRecommendations().map((rec, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <ChevronRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Next Steps */}
                      <div>
                        <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                          <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          Next Steps
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 hover:shadow-md transition-shadow">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              Download Your Report
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                              Save a PDF copy of your assessment results to share with your healthcare provider.
                            </p>
                            <Button 
                              onClick={generateReport} 
                              variant="outline" 
                              size="sm"
                              className="w-full border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                            >
                              <Download className="h-3.5 w-3.5 mr-1.5" />
                              Download PDF
                            </Button>
                          </div>
                          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 hover:shadow-md transition-shadow">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <ClipboardList className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              Track Your Progress
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                              View your assessment history to monitor changes in your symptoms over time.
                            </p>
                            <Button 
                              onClick={() => navigate('/app/history')}
                              variant="outline" 
                              size="sm"
                              className="w-full border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                            >
                              <Activity className="h-3.5 w-3.5 mr-1.5" />
                              View History
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Symptoms Tab */}
                  <TabsContent value="symptoms" className="p-6 focus:outline-none">
                    <div className="space-y-6">
                      {/* Voice Analysis */}
                      <div>
                        <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                          <Mic className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          Voice Analysis
                        </h3>
                        <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
                          <div className="mb-4">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              Voice biomarkers can provide valuable insights into neurological health. 
                              The analysis below shows the key voice features extracted from your recording.
                            </p>
                          </div>
                          {state && state.voiceFeatures && Object.keys(state.voiceFeatures).length > 0 ? (
                            <VoiceFeatures voiceFeatures={state.voiceFeatures} />
                          ) : (
                            <div className="text-center text-muted-foreground py-4">
                              Detailed voice feature data not available
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Voice Analysis Visualization */}
                      {state && state.voiceFeatures && Object.keys(state.voiceFeatures).length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                            <LineChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            Voice Analysis Visualization
                          </h3>
                          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                              This chart visualizes key voice biomarkers extracted from your recording,
                              compared to typical ranges for both healthy individuals and those with Parkinson's disease.
                            </p>
                            <VoiceAnalysisChart voiceFeatures={state.voiceFeatures} />
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Models Tab */}
                  <TabsContent value="models" className="p-6 focus:outline-none">
                    <div className="space-y-6">
                      {/* Model Comparison */}
                      <div>
                        <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                          <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          Model Comparison
                        </h3>
                        <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                            Multiple machine learning models were used to analyze your data. 
                            Each model may focus on different aspects of the assessment, providing a more comprehensive evaluation.
                          </p>
                          <ModelComparison multiModelResults={allModelResults && allModelResults.length > 0 ? 
                            { models: Object.fromEntries(
                              allModelResults.map(result => [
                                result.modelName, 
                                { 
                                  risk_score: result.riskScore,
                                  probability: result.probability,
                                  confidence: result.confidence,
                                  prediction: result.status
                                }
                              ])
                            )} : undefined
                          } />
                        </div>
                      </div>

                      {/* Model Visualization */}
                      <div>
                        <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                          <BarChart4 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          Model Visualization
                        </h3>
                        <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                            This chart visualizes how different models assessed your risk factors.
                            The ensemble model combines insights from all models for a more balanced prediction.                          </p>
                          {/* ModelComparisonChart removed to avoid duplication - already included in ModelComparison component */}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Features Tab */}
                  <TabsContent value="features" className="p-6 focus:outline-none">
                    <div className="space-y-6">
                      {/* Feature Importance */}
                      <div>
                        <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                          <BarChart4 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          Feature Importance
                        </h3>
                        <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
                          {Object.keys(featureImportance).length > 0 ? (
                            <>
                              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                                This chart shows which factors had the most significant impact on your assessment results.
                                Higher values indicate features that strongly influenced the prediction.
                              </p>
                              <FeatureImportance featureImportance={featureImportance} />
                            </>
                          ) : (
                            <div className="text-center text-muted-foreground py-4">
                              Feature importance data not available
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Voice Analysis Chart */}
                      {state && state.hasVoiceData && state.voiceFeatures && (
                        <div>
                          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                            <LineChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            Voice Analysis Visualization
                          </h3>
                          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                              This chart visualizes key voice biomarkers extracted from your recording,
                              compared to typical ranges for both healthy individuals and those with Parkinson's disease.
                            </p>
                            <VoiceAnalysisChart voiceFeatures={state.voiceFeatures} />
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;