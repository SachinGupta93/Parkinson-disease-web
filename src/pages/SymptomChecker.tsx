import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EnhancedVoiceRecorder from "@/components/EnhancedVoiceRecorder";
import { ParkinsonsFeatures, ModelType } from "@/types";
import ModelSelector from "@/components/ModelSelector";
import { apiService, ClinicalSymptoms, ClinicalAssessmentRequest } from "@/services/api";
import {
  Mic,
  Settings,
  Activity,
  AlertTriangle,
  Send,
  Volume2,
  Radio,
  Gauge,
  Scale,
  ActivitySquare,
  FileText,
  User,
  Brain,
  Stethoscope,
  HelpCircle,
  ChevronRight
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Progress } from '@/components/ui/progress';

interface SymptomFormData {
  // Clinical symptoms (boolean values)
  tremor: boolean;
  rigidity: boolean;
  bradykinesia: boolean;
  posturalInstability: boolean;
  voiceChanges: boolean;
  handwriting: boolean;
  age: number;
  
  // Voice features - optional for manual input
  mdvpFo?: number;       // Average vocal fundamental frequency (Hz)
  mdvpFhi?: number;      // Maximum vocal fundamental frequency (Hz)
  mdvpFlo?: number;      // Minimum vocal fundamental frequency (Hz)
  mdvpJitter?: number;   // Jitter percentage
  mdvpRAP?: number;      // Relative amplitude perturbation
  mdvpPPQ?: number;      // Five-point period perturbation quotient
  jitterDDP?: number;    // Average absolute difference of differences of periods
  
  // Shimmer features
  mdvpShimmer?: number;  // Shimmer percentage
  shimmerAPQ3?: number;  // Three-point amplitude perturbation quotient
  shimmerAPQ5?: number;  // Five-point amplitude perturbation quotient
  shimmerDDA?: number;   // Average absolute differences between amplitudes
  
  // Noise and frequency measures
  nhr?: number;          // Noise-to-harmonics ratio
  hnr?: number;          // Harmonics-to-noise ratio
  
  // Nonlinear measures
  rpde?: number;         // Recurrence period density entropy
  dfa?: number;          // Detrended fluctuation analysis
  spread1?: number;      // Nonlinear measure of fundamental frequency variation
  spread2?: number;      // Nonlinear measure of fundamental frequency variation
  d2?: number;           // Correlation dimension
  ppe?: number;          // Pitch period entropy
}

const SymptomChecker = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [voiceFeatures, setVoiceFeatures] = useState<Partial<ParkinsonsFeatures> | null>(null);
  const [hasVoiceData, setHasVoiceData] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType | 'ensemble'>('ensemble');
  const [activeTab, setActiveTab] = useState("symptoms");
  
  const form = useForm<SymptomFormData>({
    defaultValues: {
      // Clinical symptoms
      tremor: false,
      rigidity: false,
      bradykinesia: false,
      posturalInstability: false,
      voiceChanges: false,
      handwriting: false,
      age: 50,
      
      // Voice features
      mdvpFo: 0,
      mdvpFhi: 0,
      mdvpFlo: 0,
      mdvpJitter: 0,
      mdvpRAP: 0,
      mdvpPPQ: 0,
      jitterDDP: 0,
      
      // Shimmer features
      mdvpShimmer: 0,
      shimmerAPQ3: 0,
      shimmerAPQ5: 0,
      shimmerDDA: 0,
      
      // Noise and frequency measures
      nhr: 0,
      hnr: 0,
      
      // Nonlinear measures
      rpde: 0,
      dfa: 0,
      spread1: 0,
      spread2: 0,
      d2: 0,
      ppe: 0,
    }
  });

  const { watch, setValue, formState: { errors }, handleSubmit } = form;
  const watchedValues = watch();
  
  const onSubmit = async (data: SymptomFormData) => {
    setIsSubmitting(true);
    console.log("Form submitted with data:", data);
    console.log("Voice features:", voiceFeatures);
    console.log("Selected model:", selectedModel);
    
    try {
      // Prepare clinical symptoms data
      const clinicalSymptoms: ClinicalSymptoms = {
        tremor: data.tremor,
        rigidity: data.rigidity,
        bradykinesia: data.bradykinesia,
        posturalInstability: data.posturalInstability,
        voiceChanges: data.voiceChanges,
        handwriting: data.handwriting,
        age: data.age
      };

      // Prepare voice features if available
      let voiceData = undefined;
      if (voiceFeatures) {
        voiceData = {
          mdvpFo: voiceFeatures.mdvpFo || 0,
          mdvpFhi: voiceFeatures.mdvpFhi || 0,
          mdvpFlo: voiceFeatures.mdvpFlo || 0,
          mdvpJitter: voiceFeatures.mdvpJitter || 0,
          mdvpShimmer: voiceFeatures.mdvpShimmer || 0,
          nhr: voiceFeatures.nhr || 0,
          hnr: voiceFeatures.hnr || 0,
          rpde: voiceFeatures.rpde || 0,
          dfa: voiceFeatures.dfa || 0,
          spread1: voiceFeatures.spread1 || 0,
          spread2: voiceFeatures.spread2 || 0,
          d2: voiceFeatures.d2 || 0,
          ppe: voiceFeatures.ppe || 0
        };
      }

      // Prepare assessment request
      const assessmentRequest: ClinicalAssessmentRequest = {
        clinical_symptoms: clinicalSymptoms,
        voice_features: voiceData
      };

      console.log("Sending clinical assessment request:", assessmentRequest);

      // Send assessment to backend
      const assessmentResult = await apiService.assessClinicalSymptoms(assessmentRequest);
      
      console.log("Clinical assessment result:", assessmentResult);

      // Navigate to results page with the new data structure
      navigate("/app/results", { 
        state: { 
          clinicalAssessment: assessmentResult,
          formData: data,
          voiceFeatures: voiceFeatures,
          selectedModel: selectedModel,
          hasVoiceData: voiceFeatures !== null
        } 
      });

      toast.success("Assessment completed successfully", {
        description: `Risk score: ${typeof assessmentResult.risk_score === 'number' 
          ? assessmentResult.risk_score.toFixed(1) 
          : parseFloat(String(assessmentResult.risk_score)).toFixed(1)}%, Model: ${assessmentResult.model_used}`
      });
      
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast.error("Failed to complete assessment", {
        description: "Please check your connection and try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceAnalyzed = (voiceData: any) => {
    // Convert backend format to frontend format
    const convertedVoiceFeatures = {
      mdvpFo: voiceData.MDVP_Fo || 0,
      mdvpFhi: voiceData.MDVP_Fhi || 0,
      mdvpFlo: voiceData.MDVP_Flo || 0,
      mdvpJitter: voiceData.MDVP_Jitter || 0,
      mdvpShimmer: voiceData.MDVP_Shimmer || 0,
      nhr: voiceData.NHR || 0,
      hnr: voiceData.HNR || 0,
      rpde: voiceData.RPDE || 0,
      dfa: voiceData.DFA || 0,
      spread1: voiceData.spread1 || 0,
      spread2: voiceData.spread2 || 0,
      d2: voiceData.D2 || 0,
      ppe: voiceData.PPE || 0
    };
    
    console.log("Converting voice data:", voiceData, "to:", convertedVoiceFeatures);
    setVoiceFeatures(convertedVoiceFeatures);
    
    // Mark that voice has been analyzed
    setHasVoiceData(true);
    
    toast.success("Voice analysis completed!", {
      description: "Voice features will be combined with clinical symptoms for enhanced assessment."
    });
    
    // Move to the next tab after voice analysis
    setActiveTab("symptoms");
  };
  
  const handleModelChange = (model: ModelType | 'ensemble') => {
    setSelectedModel(model);
    toast.info(`ML model changed to ${model}`, {
      description: model === 'ensemble' ? 
        "Using predictions from all models for best accuracy" : 
        `Using ${model} model for prediction`
    });
  };

  // Calculate progress (number of filled required fields / total required fields)
  const requiredFields = [
    watchedValues.age && watchedValues.age > 0,
    typeof watchedValues.tremor === 'boolean',
    typeof watchedValues.rigidity === 'boolean',
    typeof watchedValues.bradykinesia === 'boolean',
    typeof watchedValues.posturalInstability === 'boolean',
    typeof watchedValues.voiceChanges === 'boolean',
    typeof watchedValues.handwriting === 'boolean',
  ];
  const progress = Math.round((requiredFields.filter(Boolean).length / requiredFields.length) * 100);

  // Symptom descriptions
  const symptomDescriptions = {
    tremor: "Involuntary shaking or trembling, especially at rest. Often starts in one hand or finger.",
    rigidity: "Muscle stiffness that doesn't go away when you relax. May cause decreased range of motion.",
    bradykinesia: "Slowness of movement or difficulty initiating movement. Tasks may take longer to complete.",
    posturalInstability: "Problems with balance and coordination. May cause falls or difficulty walking.",
    voiceChanges: "Changes in speech volume, clarity, or tone. Voice may become softer or more monotone.",
    handwriting: "Changes in handwriting size or quality. Writing may become smaller (micrographia) or shaky."
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Parkinson's Symptom Assessment
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete this assessment to evaluate your Parkinson's disease risk factors
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Progress and Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Progress Card */}
            <Card className="border-0 shadow-md overflow-hidden bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950/30">
              <CardHeader className="pb-2 border-b border-purple-100 dark:border-purple-900/30">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Assessment Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Form Completion
                      </span>
                      <span className="text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                        {progress}%
                      </span>
                    </div>
                    <Progress 
                      value={progress}
                      className="h-2 bg-gray-100 dark:bg-gray-800 [&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-indigo-500 dark:[&>div]:from-purple-500 dark:[&>div]:to-indigo-400"
                    />
                  </div>

                  <div className="pt-2">
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center ${activeTab === "voice" ? "bg-purple-600 dark:bg-purple-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                          {activeTab === "voice" && <div className="h-1.5 w-1.5 rounded-full bg-white"></div>}
                        </div>
                        <span className={`text-sm ${activeTab === "voice" ? "font-medium text-purple-600 dark:text-purple-400" : "text-gray-600 dark:text-gray-400"}`}>
                          Voice Analysis
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center ${activeTab === "symptoms" ? "bg-purple-600 dark:bg-purple-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                          {activeTab === "symptoms" && <div className="h-1.5 w-1.5 rounded-full bg-white"></div>}
                        </div>
                        <span className={`text-sm ${activeTab === "symptoms" ? "font-medium text-purple-600 dark:text-purple-400" : "text-gray-600 dark:text-gray-400"}`}>
                          Clinical Symptoms
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center ${activeTab === "model" ? "bg-purple-600 dark:bg-purple-500" : "bg-gray-200 dark:bg-gray-700"}`}>
                          {activeTab === "model" && <div className="h-1.5 w-1.5 rounded-full bg-white"></div>}
                        </div>
                        <span className={`text-sm ${activeTab === "model" ? "font-medium text-purple-600 dark:text-purple-400" : "text-gray-600 dark:text-gray-400"}`}>
                          Model Selection
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-0 shadow-md overflow-hidden bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950/30">
              <CardHeader className="pb-2 border-b border-blue-100 dark:border-blue-900/30">
                <CardTitle className="text-lg flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  About This Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3 text-sm">
                  <p className="text-gray-700 dark:text-gray-300">
                    This assessment combines clinical symptoms and voice analysis to evaluate Parkinson's disease risk factors.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1">How it works:</h4>
                    <ul className="space-y-2 text-blue-700 dark:text-blue-400">
                      <li className="flex items-start gap-2">
                        <Mic className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Record your voice for acoustic analysis</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Stethoscope className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>Report any clinical symptoms you experience</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Brain className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>AI models analyze your data for risk assessment</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Form Area */}
          <div className="lg:col-span-2">
            <Form {...form}>
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-b">
                  <CardTitle className="text-xl">
                    {activeTab === "voice" && "Voice Analysis"}
                    {activeTab === "symptoms" && "Clinical Symptoms Assessment"}
                    {activeTab === "model" && "Model Selection & Submission"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full rounded-none h-12 bg-gray-50 dark:bg-gray-900/50 border-b">
                      <TabsTrigger 
                        value="voice" 
                        className="flex-1 h-12 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 rounded-none"
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        Voice Analysis
                      </TabsTrigger>
                      <TabsTrigger 
                        value="symptoms" 
                        className="flex-1 h-12 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 rounded-none"
                      >
                        <ActivitySquare className="h-4 w-4 mr-2" />
                        Symptoms
                      </TabsTrigger>
                      <TabsTrigger 
                        value="model" 
                        className="flex-1 h-12 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400 rounded-none"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Model & Submit
                      </TabsTrigger>
                    </TabsList>

                    {/* Voice Analysis Tab */}
                    <TabsContent value="voice" className="p-6 focus:outline-none">
                      <div className="space-y-6">
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-900/30">
                          <div className="flex gap-3 items-start">
                            <Volume2 className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <h3 className="font-medium text-purple-900 dark:text-purple-300 mb-1">Voice Analysis</h3>
                              <p className="text-sm text-purple-800/80 dark:text-purple-400/80">
                                Record your voice saying "aaaaah" for 5 seconds. This helps our AI analyze vocal biomarkers 
                                associated with Parkinson's disease.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
                          <EnhancedVoiceRecorder onVoiceAnalyzed={handleVoiceAnalyzed} />
                        </div>

                        <div className="flex justify-end">
                          <Button 
                            type="button" 
                            onClick={() => setActiveTab("symptoms")}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Continue to Symptoms
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Symptoms Tab */}
                    <TabsContent value="symptoms" className="p-6 focus:outline-none">
                      <div className="space-y-6">
                        {/* Personal Info */}
                        <div>
                          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                            <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            Personal Information
                          </h3>
                          <div className="bg-white dark:bg-gray-900 rounded-lg border p-4">
                            <FormField
                              control={form.control}
                              name="age"
                              rules={{
                                required: "Age is required",
                                min: { value: 18, message: "Age must be 18 or older" },
                                max: { value: 120, message: "Age must be realistic" }
                              }}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700 dark:text-gray-300">Age</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="18" 
                                      max="120"
                                      {...field}
                                      onChange={e => field.onChange(parseInt(e.target.value))}
                                      className="border-gray-200 dark:border-gray-800 focus:border-purple-500 dark:focus:border-purple-400"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Clinical Symptoms */}
                        <div>
                          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                            <ActivitySquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            Clinical Symptoms
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Tremor */}
                            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 hover:shadow-md transition-shadow">
                              <FormField
                                control={form.control}
                                name="tremor"
                                render={({ field }) => (
                                  <FormItem className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Radio className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                      <FormLabel className="text-base font-medium text-gray-900 dark:text-gray-100 m-0">
                                        Tremor
                                      </FormLabel>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                      {symptomDescriptions.tremor}
                                    </p>
                                    <FormControl>
                                      <div className="flex items-center space-x-2 mt-2">
                                        <Checkbox 
                                          checked={field.value} 
                                          onCheckedChange={field.onChange}
                                          className="border-purple-400 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                        />
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                          I experience this symptom
                                        </label>
                                      </div>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Rigidity */}
                            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 hover:shadow-md transition-shadow">
                              <FormField
                                control={form.control}
                                name="rigidity"
                                render={({ field }) => (
                                  <FormItem className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Radio className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                      <FormLabel className="text-base font-medium text-gray-900 dark:text-gray-100 m-0">
                                        Rigidity
                                      </FormLabel>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                      {symptomDescriptions.rigidity}
                                    </p>
                                    <FormControl>
                                      <div className="flex items-center space-x-2 mt-2">
                                        <Checkbox 
                                          checked={field.value} 
                                          onCheckedChange={field.onChange}
                                          className="border-purple-400 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                        />
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                          I experience this symptom
                                        </label>
                                      </div>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Bradykinesia */}
                            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 hover:shadow-md transition-shadow">
                              <FormField
                                control={form.control}
                                name="bradykinesia"
                                render={({ field }) => (
                                  <FormItem className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Radio className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                      <FormLabel className="text-base font-medium text-gray-900 dark:text-gray-100 m-0">
                                        Bradykinesia
                                      </FormLabel>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                      {symptomDescriptions.bradykinesia}
                                    </p>
                                    <FormControl>
                                      <div className="flex items-center space-x-2 mt-2">
                                        <Checkbox 
                                          checked={field.value} 
                                          onCheckedChange={field.onChange}
                                          className="border-purple-400 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                        />
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                          I experience this symptom
                                        </label>
                                      </div>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Postural Instability */}
                            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 hover:shadow-md transition-shadow">
                              <FormField
                                control={form.control}
                                name="posturalInstability"
                                render={({ field }) => (
                                  <FormItem className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Radio className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                      <FormLabel className="text-base font-medium text-gray-900 dark:text-gray-100 m-0">
                                        Postural Instability
                                      </FormLabel>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                      {symptomDescriptions.posturalInstability}
                                    </p>
                                    <FormControl>
                                      <div className="flex items-center space-x-2 mt-2">
                                        <Checkbox 
                                          checked={field.value} 
                                          onCheckedChange={field.onChange}
                                          className="border-purple-400 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                        />
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                          I experience this symptom
                                        </label>
                                      </div>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Voice Changes */}
                            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 hover:shadow-md transition-shadow">
                              <FormField
                                control={form.control}
                                name="voiceChanges"
                                render={({ field }) => (
                                  <FormItem className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Radio className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                      <FormLabel className="text-base font-medium text-gray-900 dark:text-gray-100 m-0">
                                        Voice Changes
                                      </FormLabel>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                      {symptomDescriptions.voiceChanges}
                                    </p>
                                    <FormControl>
                                      <div className="flex items-center space-x-2 mt-2">
                                        <Checkbox 
                                          checked={field.value} 
                                          onCheckedChange={field.onChange}
                                          className="border-purple-400 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                        />
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                          I experience this symptom
                                        </label>
                                      </div>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>

                            {/* Handwriting */}
                            <div className="bg-white dark:bg-gray-900 rounded-lg border p-4 hover:shadow-md transition-shadow">
                              <FormField
                                control={form.control}
                                name="handwriting"
                                render={({ field }) => (
                                  <FormItem className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Radio className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                      <FormLabel className="text-base font-medium text-gray-900 dark:text-gray-100 m-0">
                                        Handwriting Changes
                                      </FormLabel>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                      {symptomDescriptions.handwriting}
                                    </p>
                                    <FormControl>
                                      <div className="flex items-center space-x-2 mt-2">
                                        <Checkbox 
                                          checked={field.value} 
                                          onCheckedChange={field.onChange}
                                          className="border-purple-400 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                        />
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                          I experience this symptom
                                        </label>
                                      </div>
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between">
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => setActiveTab("voice")}
                            className="border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/50"
                          >
                            Back to Voice Analysis
                          </Button>
                          <Button 
                            type="button" 
                            onClick={() => setActiveTab("model")}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Continue to Model Selection
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Model Selection Tab */}
                    <TabsContent value="model" className="p-6 focus:outline-none">
                      <div className="space-y-6">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                          <div className="flex gap-3 items-start">
                            <Brain className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <h3 className="font-medium text-indigo-900 dark:text-indigo-300 mb-1">Model Selection</h3>
                              <p className="text-sm text-indigo-800/80 dark:text-indigo-400/80">
                                Choose which AI model to use for your assessment. The ensemble model combines multiple 
                                algorithms for the most comprehensive analysis.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
                          <ModelSelector 
                            selectedModel={selectedModel} 
                            onModelChange={handleModelChange} 
                          />
                        </div>

                        <div className="flex justify-between">
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => setActiveTab("symptoms")}
                            className="border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/50"
                          >
                            Back to Symptoms
                          </Button>
                          <Button 
                            type="submit" 
                            onClick={handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6"
                          >
                            {isSubmitting ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                              </>
                            ) : (
                              <>
                                Submit Assessment
                                <Send className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SymptomChecker;