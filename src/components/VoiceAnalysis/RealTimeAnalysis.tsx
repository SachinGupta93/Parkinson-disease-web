import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { mlService } from '../../services/mlService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Mic, MicOff, Play, Pause, Square } from 'lucide-react';
import { Progress } from '../ui/progress';
import { VoiceFeatureExtractor } from '../../utils/voiceFeatureExtractor';

interface VoiceMetrics {
  pitch: number;
  jitter: number;
  shimmer: number;
  hnr: number;
  [key: string]: number;
}

export const RealTimeAnalysis: React.FC = () => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [metrics, setMetrics] = useState<VoiceMetrics>({
    pitch: 0,
    jitter: 0,
    shimmer: 0,
    hnr: 0
  });
  const [audioLevel, setAudioLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const featureExtractorRef = useRef<VoiceFeatureExtractor | null>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const featureExtractor = new VoiceFeatureExtractor();
      await featureExtractor.startRecording(stream);
      featureExtractorRef.current = featureExtractor;

      setIsRecording(true);
      updateMetrics();
    } catch (err) {
      setError('Error accessing microphone');
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsRecording(false);
  };
  const updateMetrics = () => {
    if (!featureExtractorRef.current || !isRecording) return;

    const update = async () => {
      try {
        const features = await featureExtractorRef.current?.extractFeatures();
        if (features) {
          setMetrics({
            pitch: features.MDVP_Fo,
            jitter: features.MDVP_Jitter,
            shimmer: features.MDVP_Shimmer,
            hnr: features.HNR
          });
          setAudioLevel(features.MDVP_Fo / 1000); // Normalize for visualization
        }
        animationFrameRef.current = requestAnimationFrame(update);
      } catch (error) {
        console.error("Error extracting features:", error);
      }
    };

    update();
  };
  const handleAnalyze = async () => {
    if (!user) return;

    setIsAnalyzing(true);
    setError(null);
    setSuccess(false);

    try {
      // Format data according to backend's expected format
      const voiceData = {
        pitch: metrics.pitch,
        jitter: metrics.jitter,
        shimmer: metrics.shimmer,
        hnr: metrics.hnr
      };
      
      // Send to backend API
      const prediction = await mlService.predictVoiceMetrics(voiceData);
      
      // Save the result to Firebase
      await mlService.saveAnalysisResult(user?.uid || 'guest', metrics, prediction);
      setSuccess(true);
      
      // You could navigate to results/visualization page here if needed
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Real-time Voice Analysis</CardTitle>
        <CardDescription>
          Record your voice for real-time analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">Analysis completed successfully!</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Audio Level Visualization */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Audio Level</span>
              <span>{(audioLevel * 100).toFixed(1)}%</span>
            </div>
            <Progress value={audioLevel * 100} />
          </div>

          {/* Voice Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Pitch</span>
                <span>{metrics.pitch.toFixed(2)} Hz</span>
              </div>
              <Progress value={(metrics.pitch / 1000) * 100} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Jitter</span>
                <span>{(metrics.jitter * 100).toFixed(2)}%</span>
              </div>
              <Progress value={metrics.jitter * 100} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Shimmer</span>
                <span>{(metrics.shimmer * 100).toFixed(2)}%</span>
              </div>
              <Progress value={metrics.shimmer * 100} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>HNR</span>
                <span>{metrics.hnr.toFixed(2)} dB</span>
              </div>
              <Progress value={(metrics.hnr / 100) * 100} />
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-4">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                className="flex items-center space-x-2"
              >
                <Mic className="h-4 w-4" />
                <span>Start Recording</span>
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="flex items-center space-x-2"
              >
                <MicOff className="h-4 w-4" />
                <span>Stop Recording</span>
              </Button>
            )}
            <Button
              onClick={handleAnalyze}
              disabled={!isRecording || isAnalyzing}
              className="flex items-center space-x-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Analyze</span>
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>Analysis saved successfully!</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 