import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EnhancedVoiceRecorder from "@/components/EnhancedVoiceRecorder";
import { ParkinsonsFeatures, ModelType } from "@/utils/parkinsonPredictor";
import ModelSelector from "@/components/ModelSelector";
import {
  Mic,
  ClipboardList,
  Settings,
  LineChart,
  Activity,
  Brain,
  PencilRuler,
  AlertTriangle,
  Calendar,
  Send,
  Volume2,
  // Waveform,
  Radio,
  Gauge,
  Scale,
  ActivitySquare,
  FileText,
  User
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
  // Clinical symptoms
  tremor: number;
  rigidity: number;
  bradykinesia: number;
  posturalInstability: number;
  voiceChanges: number;
  handwriting: number;
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
  const [selectedModel, setSelectedModel] = useState<ModelType | 'ensemble'>('ensemble');
    const form = useForm<SymptomFormData>({
    defaultValues: {
      // Clinical symptoms
      tremor: 0,
      rigidity: 0,
      bradykinesia: 0,
      posturalInstability: 0,
      voiceChanges: 0,
      handwriting: 0,
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

  const { watch, setValue, formState: { errors } } = form;
  const watchedValues = watch();
    const onSubmit = (data: SymptomFormData) => {
    setIsSubmitting(true);
    console.log("Form submitted with data:", data);
    console.log("Voice features:", voiceFeatures);
    console.log("Selected model:", selectedModel);
    
    try {
      // Filter out zero values from the voice parameters if they weren't actually set
      const cleanedData = { ...data };
      const voiceKeys = [
        'mdvpFo', 'mdvpFhi', 'mdvpFlo', 'mdvpJitter', 'mdvpRAP',
        'mdvpPPQ', 'jitterDDP', 'mdvpShimmer', 'shimmerAPQ3', 'shimmerAPQ5',
        'shimmerDDA', 'nhr', 'hnr', 'rpde', 'dfa', 'spread1', 'spread2',
        'd2', 'ppe'
      ];
      
      let hasVoiceData = false;
      voiceKeys.forEach(key => {
        if (cleanedData[key as keyof SymptomFormData] !== 0) {
          hasVoiceData = true;
        }
      });
      
      // If there's voice data from the recorder, prioritize it
      const allFeatures = {
        ...cleanedData,
        ...(voiceFeatures || {})
      };

        // Pass data to results page
      navigate("/app/results", { 
        state: { 
          formData: cleanedData, 
          voiceFeatures: voiceFeatures || (hasVoiceData ? cleanedData : null),
          selectedModel: selectedModel,
          hasVoiceData: hasVoiceData || voiceFeatures !== null
        } 
      });

      toast.success("Assessment data submitted successfully");
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit assessment data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSliderChange = (name: keyof SymptomFormData, value: number[]) => {
    setValue(name, value[0]);
  };

  const getSliderDescription = (value: number) => {
    if (value <= 1) return "None";
    if (value <= 3) return "Mild";
    if (value <= 6) return "Moderate";
    return "Severe";
  };
  const handleVoiceAnalyzed = (voiceData: any) => {
    setVoiceFeatures(voiceData);
    
    // Also populate the corresponding form fields
    if (voiceData) {
      Object.keys(voiceData).forEach((key) => {
        if (key in form.getValues()) {
          setValue(key as keyof SymptomFormData, voiceData[key]);
        }
      });
    }
    
    toast.success("Voice features extracted successfully", {
      description: "Your voice data will be included in the assessment."
    });
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
    watchedValues.age,
    watchedValues.tremor,
    watchedValues.rigidity,
    watchedValues.bradykinesia,
    watchedValues.posturalInstability,
    watchedValues.voiceChanges,
    watchedValues.handwriting,
  ];
  const progress = Math.round((requiredFields.filter(v => v && v !== 0).length / requiredFields.length) * 100);

  return (
    <Form {...form}>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm text-zinc-600 dark:text-zinc-300">Form Completion</span>
            <span className="text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
              {progress}%
            </span>
          </div>
          <Progress 
            value={progress}
            className="h-2 bg-zinc-100 dark:bg-zinc-800 [&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-teal-500 dark:[&>div]:from-purple-500 dark:[&>div]:to-teal-400"
          />
        </div>

        {/* Personal Info Card */}
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <User size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <CardTitle className="text-xl">Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
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
                  <FormLabel className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                    <User size={16} className="text-purple-600 dark:text-purple-400" /> 
                    Age
                  </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="18" 
                            max="120"
                            {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                      className="border-zinc-200 dark:border-zinc-800 focus:border-purple-500 dark:focus:border-purple-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
          </CardContent>
        </Card>

        {/* Clinical Symptoms Card */}
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
              <ActivitySquare size={20} className="text-teal-600 dark:text-teal-400" />
            </div>
            <CardTitle className="text-xl">Clinical Symptoms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
                    {/* Tremor */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                <Label htmlFor="tremor" className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <Radio size={16} className="text-purple-600 dark:text-purple-400" /> 
                  Tremor
                        </Label>
                <span className="text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                  {getSliderDescription(watchedValues.tremor)}
                        </span>
                      </div>
                      <Slider
                        id="tremor"
                        min={0}
                        max={10}
                        step={1}
                        value={[watchedValues.tremor]}
                onValueChange={v => handleSliderChange('tremor', v)} 
                className="[&_[role=slider]]:bg-purple-600 dark:[&_[role=slider]]:bg-purple-500"
                        aria-label="Tremor severity"
                      />
                    </div>
                    
                    {/* Rigidity */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                <Label htmlFor="rigidity" className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <Scale size={16} className="text-teal-600 dark:text-teal-400" /> 
                  Rigidity
                </Label>
                <span className="text-sm font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full">
                  {getSliderDescription(watchedValues.rigidity)}
                        </span>
                      </div>
                      <Slider
                        id="rigidity"
                        min={0}
                        max={10}
                        step={1}
                        value={[watchedValues.rigidity]}
                onValueChange={v => handleSliderChange('rigidity', v)} 
                className="[&_[role=slider]]:bg-teal-600 dark:[&_[role=slider]]:bg-teal-500"
                        aria-label="Rigidity severity"
                      />
                    </div>
                    
            {/* Continue with other symptoms following the same pattern... */}
                    {/* Bradykinesia */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                <Label htmlFor="bradykinesia" className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <Gauge size={16} className="text-purple-600 dark:text-purple-400" /> 
                  Bradykinesia
                </Label>
                <span className="text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                  {getSliderDescription(watchedValues.bradykinesia)}
                        </span>
                      </div>
                      <Slider
                        id="bradykinesia"
                        min={0}
                        max={10}
                        step={1}
                        value={[watchedValues.bradykinesia]}
                onValueChange={v => handleSliderChange('bradykinesia', v)} 
                className="[&_[role=slider]]:bg-purple-600 dark:[&_[role=slider]]:bg-purple-500"
                        aria-label="Bradykinesia severity"
                      />
                    </div>
                    
                    {/* Postural Instability */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                <Label htmlFor="posturalInstability" className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <Activity size={16} className="text-teal-600 dark:text-teal-400" /> 
                  Balance Problems
                </Label>
                <span className="text-sm font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full">
                  {getSliderDescription(watchedValues.posturalInstability)}
                        </span>
                      </div>
                      <Slider
                        id="posturalInstability"
                        min={0}
                        max={10}
                        step={1}
                        value={[watchedValues.posturalInstability]}
                onValueChange={v => handleSliderChange('posturalInstability', v)} 
                className="[&_[role=slider]]:bg-teal-600 dark:[&_[role=slider]]:bg-teal-500"
                        aria-label="Balance problems severity"
                      />
                    </div>
                    
                    {/* Voice Changes */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                <Label htmlFor="voiceChanges" className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <Volume2 size={16} className="text-purple-600 dark:text-purple-400" /> 
                  Voice Changes
                </Label>
                <span className="text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                  {getSliderDescription(watchedValues.voiceChanges)}
                        </span>
                      </div>
                      <Slider
                        id="voiceChanges"
                        min={0}
                        max={10}
                        step={1}
                        value={[watchedValues.voiceChanges]}
                onValueChange={v => handleSliderChange('voiceChanges', v)} 
                className="[&_[role=slider]]:bg-purple-600 dark:[&_[role=slider]]:bg-purple-500"
                        aria-label="Voice changes severity"
                      />
                    </div>
                    
                    {/* Handwriting */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                <Label htmlFor="handwriting" className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                  <FileText size={16} className="text-teal-600 dark:text-teal-400" /> 
                  Handwriting Changes
                </Label>
                <span className="text-sm font-medium bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full">
                  {getSliderDescription(watchedValues.handwriting)}
                        </span>
                      </div>
                      <Slider
                        id="handwriting"
                        min={0}
                        max={10}
                        step={1}
                        value={[watchedValues.handwriting]}
                onValueChange={v => handleSliderChange('handwriting', v)} 
                className="[&_[role=slider]]:bg-teal-600 dark:[&_[role=slider]]:bg-teal-500"
                        aria-label="Handwriting changes severity"
                        />
                      </div>
            </CardContent>
        </Card>

        <Tabs defaultValue="voice" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            <TabsTrigger 
              value="voice" 
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"
            >
              <Mic size={18} />
              <span>Voice Analysis</span>
            </TabsTrigger>
            <TabsTrigger 
              value="manual" 
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"
            >
              <ClipboardList size={18} />
              <span>Manual Input</span>
            </TabsTrigger>
            <TabsTrigger 
              value="advanced" 
              className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"
            >
              <Settings size={18} />
              <span>Advanced Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Voice Analysis Tab */}
        <TabsContent value="voice" className="mt-4">
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Mic size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-xl">Voice Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Voice analysis can detect subtle changes in speech patterns that may be indicative of Parkinson's disease.
                  Record your voice saying "aaah" for 5-10 seconds.
                </p>
                
                <div className="my-8">
                  <EnhancedVoiceRecorder onVoiceAnalyzed={handleVoiceAnalyzed} />
                </div>
                
                {voiceFeatures && (
                  <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                    <h4 className="font-medium mb-3 text-purple-900 dark:text-purple-100">Voice Features Detected</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">Avg. Frequency (Hz)</span>
                          <span className="font-mono text-purple-600 dark:text-purple-400">{voiceFeatures.mdvpFo?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">Max Frequency (Hz)</span>
                          <span className="font-mono text-purple-600 dark:text-purple-400">{voiceFeatures.mdvpFhi?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">Min Frequency (Hz)</span>
                          <span className="font-mono text-purple-600 dark:text-purple-400">{voiceFeatures.mdvpFlo?.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">Jitter (%)</span>
                          <span className="font-mono text-purple-600 dark:text-purple-400">{(voiceFeatures.mdvpJitter || 0) * 100}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">Shimmer (%)</span>
                          <span className="font-mono text-purple-600 dark:text-purple-400">{(voiceFeatures.mdvpShimmer || 0) * 100}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-600 dark:text-zinc-400">Noise-Harmonic Ratio</span>
                          <span className="font-mono text-purple-600 dark:text-purple-400">{voiceFeatures.nhr?.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <div className="w-full text-center text-xs text-zinc-500 dark:text-zinc-400">
                  Voice recordings are processed locally and not stored on our servers.
                </div>
              </CardFooter>
            </Card>
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => onSubmit(form.getValues())}
                disabled={isSubmitting || !voiceFeatures}
                className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    <span>Submit Voice Analysis</span>
                  </>
                )}
              </Button>
          </div>
        </TabsContent>

          {/* Manual Input Tab */}
          <TabsContent value="manual" className="mt-4">
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                  <ClipboardList size={20} className="text-teal-600 dark:text-teal-400" />
                </div>
                <CardTitle className="text-xl">Manual Assessment Input</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Voice Parameters Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <LineChart size={18} className="text-teal-600 dark:text-teal-400" />
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Voice Parameters (Optional)</h3>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    These advanced parameters are optional and are typically extracted from voice recordings. 
                    If you've already completed a voice analysis, you can leave these fields empty.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-zinc-900 dark:text-zinc-100">Vocal Frequency</h4>
                      
                      {/* MDVP:Fo(Hz) */}
                      <FormField
                        control={form.control}
                        name="mdvpFo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-700 dark:text-zinc-300">Avg. Fundamental Frequency (Hz)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="120-180 Hz"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                className="border-zinc-200 dark:border-zinc-800 focus:border-teal-500 dark:focus:border-teal-400"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {/* Jitter */}
                      <FormField
                        control={form.control}
                        name="mdvpJitter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-700 dark:text-zinc-300">Jitter (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.0001"
                                placeholder="0.001-0.01"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                className="border-zinc-200 dark:border-zinc-800 focus:border-teal-500 dark:focus:border-teal-400"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                  </div>
                  
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-zinc-900 dark:text-zinc-100">Shimmer & Noise</h4>
                      
                      {/* MDVP:Shimmer */}
                      <FormField
                        control={form.control}
                        name="mdvpShimmer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-700 dark:text-zinc-300">Shimmer (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.001"
                                placeholder="0.02-0.06"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                className="border-zinc-200 dark:border-zinc-800 focus:border-teal-500 dark:focus:border-teal-400"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      {/* NHR */}
                      <FormField
                        control={form.control}
                        name="nhr"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-700 dark:text-zinc-300">Noise-to-Harmonics Ratio</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.001"
                                placeholder="0.01-0.05"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                className="border-zinc-200 dark:border-zinc-800 focus:border-teal-500 dark:focus:border-teal-400"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                    </div>
              </CardContent>
            </Card>
            <div className="flex justify-end mt-4">
              <Button
                type="submit"
                form="manual-form"
                onClick={() => onSubmit(form.getValues())}
                disabled={isSubmitting}
                className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    <span>Submit Manual Assessment</span>
                  </>
                )}
              </Button>
          </div>
        </TabsContent>
        
          {/* Advanced Settings Tab */}
        <TabsContent value="advanced" className="mt-4">
            <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Settings size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-xl">Advanced ML Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Configure which machine learning model to use for your assessment. Each model has different 
                  strengths depending on the data available.
                </p>
                
                <ModelSelector 
                  selectedModel={selectedModel} 
                  onModelChange={handleModelChange}
                />
                
                <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                  <h4 className="font-medium mb-3 text-purple-900 dark:text-purple-100">Model Details</h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium text-purple-900 dark:text-purple-100">XGBoost</h5>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        A gradient boosting algorithm that excels at handling mixed clinical and voice features.
                        Good at finding complex patterns in data.
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-purple-900 dark:text-purple-100">Random Forest</h5>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        An ensemble of decision trees that is robust against overfitting and handles
                        missing data well. Effective with limited voice features.
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-purple-900 dark:text-purple-100">Neural Network</h5>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Deep learning model that excels at finding complex patterns in rich voice datasets.
                        May overfit with limited data.
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-purple-900 dark:text-purple-100">Support Vector Machine</h5>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Effective at separating borderline cases in high-dimensional feature spaces.
                        Works well with strong clinical features.
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-purple-900 dark:text-purple-100">Ensemble (Recommended)</h5>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Combines predictions from all models, weighted by confidence, for maximum accuracy.
                        The best choice for most users.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end mt-4">
              <Button
                type="submit"
                form="manual-form"
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Settings size={16} className="mr-2" />
                    <span>Apply Settings</span>
                  </>
                )}
              </Button>
          </div>
        </TabsContent>
      </Tabs>

        {/* Disclaimer */}
        <div className="text-sm text-zinc-600 dark:text-zinc-400 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
        <p className="flex items-start gap-2">
          <AlertTriangle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
          <span>
              <strong className="text-yellow-700 dark:text-yellow-300">Note:</strong> This tool is for informational purposes only and does not replace professional medical advice.
            If you are concerned about your symptoms, please consult a healthcare professional.
          </span>
        </p>
      </div>
    </div>
    </Form>
  );
};

export default SymptomChecker;
