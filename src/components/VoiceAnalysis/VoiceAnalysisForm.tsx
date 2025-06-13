import { useState, useRef, useEffect } from 'react';
import { useData } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { VoiceFeatureExtractor } from '@/utils/voiceFeatureExtractor';
import { useApi } from '@/hooks/useApi';
import ApiError from '@/components/ApiError';
import { VoiceFeatures, VoiceAnalysisResponse } from '@/types/voice';

export const VoiceAnalysisForm = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [realTimeFeatures, setRealTimeFeatures] = useState<{[key: string]: number}>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const featureExtractorRef = useRef<VoiceFeatureExtractor | null>(null);
  const analysisIntervalRef = useRef<number | null>(null);
    const { user } = useAuth();
  const { saveVoiceData, saveHistory } = useData(user?.uid || '');  const { post, loading: apiLoading, error: apiError } = useApi<VoiceAnalysisResponse>({
    showErrorToast: false, // We'll handle errors manually
  });

  useEffect(() => {
    featureExtractorRef.current = new VoiceFeatureExtractor();
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      if (featureExtractorRef.current) {
        featureExtractorRef.current.stopRecording();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      // Start real-time feature extraction
      if (featureExtractorRef.current) {
        await featureExtractorRef.current.startRecording(stream);
        analysisIntervalRef.current = window.setInterval(async () => {
          const features = await featureExtractorRef.current?.extractFeatures();
          if (features) {
            setRealTimeFeatures(features);
          }
        }, 1000);
      }

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      toast.error('Failed to start recording');
      console.error('Recording error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      
      if (featureExtractorRef.current) {
        featureExtractorRef.current.stopRecording();
      }
      
      toast.success('Recording stopped');
    }
  };  const analyzeVoice = async () => {
    if (!user) {
      toast.error('Please login to analyze voice');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      // Use the last extracted features
      setProgress(30);
      
      // Format data according to FastAPI backend expectations and add validation
      if (!realTimeFeatures || Object.keys(realTimeFeatures).length === 0) {
        throw new Error('No voice features detected. Please record your voice again.');
      }
      
      const features: VoiceFeatures = {
        pitch: realTimeFeatures.MDVP_Fo || 0,
        jitter: realTimeFeatures.MDVP_Jitter || 0,
        shimmer: realTimeFeatures.MDVP_Shimmer || 0,
        hnr: realTimeFeatures.HNR || 0
      };
        // Send to ML backend using our API hook
      setProgress(60);
      const analysis = await post<VoiceAnalysisResponse>('/predict', features);
      
      if (!analysis) {
        throw new Error('Failed to get analysis from server');
      }
      
      // Save to Firebase
      setProgress(90);
      await saveVoiceData({
        timestamp: new Date(),
        voiceMetrics: {
          pitch: features.pitch,
          amplitude: features.shimmer,
          frequency: realTimeFeatures.MDVP_Fhi || 0,  // Use original features for additional metrics
          tremor: features.jitter
        },
        analysisResults: {
          severity: analysis.severity,
          confidence: analysis.confidence,
          recommendations: analysis.recommendations
        }
      });

      await saveHistory({
        type: 'voice_analysis',
        date: new Date(),
        data: analysis
      });

      setProgress(100);
      toast.success('Voice analysis completed', {
        description: `Severity score: ${analysis.severity}%`
      });
    } catch (error) {
      toast.error('Failed to analyze voice recording', {
        description: error instanceof Error ? error.message : 'Please try again later'
      });
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Voice Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center space-x-4">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "default"}
            disabled={isAnalyzing}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Button>
          <Button
            onClick={analyzeVoice}
            disabled={!audioChunksRef.current.length || isRecording || isAnalyzing}
          >
            Analyze Voice
          </Button>
        </div>

        {isRecording && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Real-time Features:</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Pitch (MDVP_Fo): {realTimeFeatures.MDVP_Fo?.toFixed(2)} Hz</div>
              <div>Jitter: {realTimeFeatures.MDVP_Jitter?.toFixed(4)}</div>
              <div>Shimmer: {realTimeFeatures.MDVP_Shimmer?.toFixed(4)}</div>
              <div>HNR: {realTimeFeatures.HNR?.toFixed(2)} dB</div>
            </div>
          </div>
        )}        {isAnalyzing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center">Analyzing voice recording... {progress}%</p>
          </div>
        )}
        
        {/* Show API errors */}
        {apiError && !isAnalyzing && (
          <div className="mb-4">
            <ApiError 
              error={apiError} 
              retry={() => analyzeVoice()} 
              message="Error analyzing voice recording"
            />
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p>Instructions:</p>
          <ul className="list-disc list-inside">
            <li>Click "Start Recording" to begin voice recording</li>
            <li>Speak clearly into your microphone</li>
            <li>Click "Stop Recording" when finished</li>
            <li>Click "Analyze Voice" to process the recording</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 