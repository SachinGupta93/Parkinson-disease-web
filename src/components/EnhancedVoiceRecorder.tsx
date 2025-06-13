
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { apiService } from "@/services/api";
import {
  Mic,
  Square,
  Play,
  Volume
} from "lucide-react";

// Helper function to generate mock voice data for testing/fallback
const getMockVoiceData = () => {
  return {
    MDVP_Fo: 154.23 + (Math.random() * 10 - 5),
    MDVP_Fhi: 197.10 + (Math.random() * 10 - 5),
    MDVP_Flo: 116.82 + (Math.random() * 10 - 5),
    MDVP_Jitter: 0.006 + (Math.random() * 0.002 - 0.001),
    MDVP_Jitter_Abs: 0.00005 + (Math.random() * 0.00002 - 0.00001),
    MDVP_RAP: 0.003 + (Math.random() * 0.001 - 0.0005),
    MDVP_PPQ: 0.003 + (Math.random() * 0.001 - 0.0005),
    Jitter_DDP: 0.009 + (Math.random() * 0.002 - 0.001),
    MDVP_Shimmer: 0.04 + (Math.random() * 0.01 - 0.005),
    MDVP_Shimmer_dB: 0.35 + (Math.random() * 0.1 - 0.05),
    Shimmer_APQ3: 0.02 + (Math.random() * 0.005 - 0.0025),
    Shimmer_APQ5: 0.025 + (Math.random() * 0.005 - 0.0025),
    MDVP_APQ: 0.03 + (Math.random() * 0.005 - 0.0025),
    Shimmer_DDA: 0.06 + (Math.random() * 0.01 - 0.005),
    NHR: 0.02 + (Math.random() * 0.01 - 0.005),
    HNR: 21.5 + (Math.random() * 3 - 1.5),
    RPDE: 0.5 + (Math.random() * 0.1 - 0.05),
    DFA: 0.7 + (Math.random() * 0.1 - 0.05),
    spread1: -5.5 + (Math.random() * 1 - 0.5),
    spread2: 0.2 + (Math.random() * 0.1 - 0.05),
    D2: 2.3 + (Math.random() * 0.2 - 0.1),
    PPE: 0.2 + (Math.random() * 0.05 - 0.025)
  };
};

interface EnhancedVoiceRecorderProps {
  onVoiceAnalyzed: (voiceData: any) => void;
}

const EnhancedVoiceRecorder: React.FC<EnhancedVoiceRecorderProps> = ({ onVoiceAnalyzed }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioAnalysis, setAudioAnalysis] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Clean up audio context and animation frame on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Set up audio context and analyser for visualizing audio
  const setupAudioVisualization = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    
    const analyser = audioContext.createAnalyser();
    analyserRef.current = analyser;
    analyser.fftSize = 256;
    
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateVolumeLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume level
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const normalizedAverage = average / 255; // Normalize to 0-1
      
      setAudioVolume(prev => {
        const newArray = [...prev, normalizedAverage];
        if (newArray.length > 50) {
          newArray.shift();
        }
        return newArray;
      });
      
      animationFrameRef.current = requestAnimationFrame(updateVolumeLevel);
    };
    
    updateVolumeLevel();
  };
  
  const startRecording = async () => {
    try {
      // Clear previous data
      audioChunksRef.current = [];
      setAudioUrl(null);
      setAudioAnalysis(null);
      setAudioVolume([]);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to use audio/wav format if supported, fallback to audio/webm
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      } else if (MediaRecorder.isTypeSupported('audio/mp3')) {
        mimeType = 'audio/mp3';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }
      
      console.log(`Using audio format: ${mimeType}`);
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });
      
      mediaRecorder.addEventListener("stop", handleRecordingStop);
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Set up audio visualization
      setupAudioVisualization(stream);
      
      // Start timer
      let seconds = 0;
      timerRef.current = window.setInterval(() => {
        seconds += 1;
        setRecordingTime(seconds);
        
        // Auto stop after 10 seconds
        if (seconds >= 10) {
          stopRecording();
        }
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone. Please check your permissions.");
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Stop visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      setIsRecording(false);
    }
  };
  
  const handleRecordingStop = async () => {
    if (audioChunksRef.current.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      // Get the MIME type from the recorder
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      
      // Determine file extension based on MIME type
      let fileExtension = 'webm';
      if (mimeType.includes('wav')) {
        fileExtension = 'wav';
      } else if (mimeType.includes('mp3')) {
        fileExtension = 'mp3';
      } else if (mimeType.includes('ogg')) {
        fileExtension = 'ogg';
      }
      
      console.log(`Creating audio blob with type: ${mimeType}`);
      
      // Create audio blob and URL for playback
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      // Convert Blob to File for API compatibility
      const audioFile = new File([audioBlob], `voice-recording.${fileExtension}`, { 
        type: mimeType,
        lastModified: Date.now()
      });
      
      // Analyze voice recording using the real API service
      const voiceFeatures = await apiService.analyzeVoiceFile(audioFile);
      
      // Convert to simplified voice data for the component
      const simplifiedVoiceData = {
        pitch: voiceFeatures.MDVP_Fo,
        jitter: voiceFeatures.MDVP_Jitter,
        shimmer: voiceFeatures.MDVP_Shimmer,
        hnr: voiceFeatures.HNR
      };
      
      setAudioAnalysis(voiceFeatures);
      onVoiceAnalyzed(voiceFeatures);
      
      console.log("FRONTEND: Voice analysis successful:", voiceFeatures);
      toast.success("Voice recording analyzed successfully");
    } catch (error) {
      console.error("Error processing voice recording:", error);
      toast.error("Failed to analyze voice recording. Please try again.");
      
      // Fallback to mock data if real API fails
      try {
        // Use the helper function to get mock data
        const mockVoiceFeatures = getMockVoiceData();
        
        setAudioAnalysis(mockVoiceFeatures);
        onVoiceAnalyzed(mockVoiceFeatures);
        
        console.log("FRONTEND: Using fallback mock data:", mockVoiceFeatures);
        toast.info("Using fallback data for demonstration");
      } catch (fallbackError) {
        console.error("Even fallback failed:", fallbackError);
      }
    } finally {
      setIsProcessing(false);
      setRecordingTime(0);
    }
  };
  
  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };
  
  return (
    <Card className="shadow-md border-primary/20">
      <CardHeader>
        <CardTitle>Voice Analyzer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-medium">Voice Sample</h3>
          <p className="text-sm text-muted-foreground">
            Record your voice saying "aaah" for up to 10 seconds
          </p>
        </div>
        
        {/* Volume Visualization */}
        <div className="h-16 bg-secondary/20 rounded-md flex items-end p-1 overflow-hidden">
          {isRecording ? (
            audioVolume.map((volume, index) => (
              <div 
                key={index}
                className="w-1 mx-0.5 rounded-t-sm bg-primary"
                style={{ 
                  height: `${Math.max(4, volume * 100)}%`,
                  opacity: Math.min(0.3 + volume, 1)
                }}
              />
            ))
          ) : audioUrl ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-xs">Recording complete</span>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-xs">No recording yet</span>
            </div>
          )}
        </div>
        
        {/* Recording Progress */}
        {isRecording && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>0:00</span>
              <span>0:{recordingTime < 10 ? `0${recordingTime}` : recordingTime}</span>
              <span>0:10</span>
            </div>
            <Progress value={recordingTime * 10} className="h-1" />
          </div>
        )}
        
        {/* Controls */}
        <div className="flex justify-center space-x-3">
          {isRecording ? (
            <Button 
              variant="destructive"
              size="sm"
              onClick={stopRecording}
              className="flex items-center gap-2"
            >
              <Square className="h-4 w-4" />
              Stop Recording
            </Button>
          ) : isProcessing ? (
            <Button disabled>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-transparent border-primary mr-2"></div>
              Analyzing...
            </Button>
          ) : audioUrl ? (
            <>
              <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={isPlaying ? stopAudio : playAudio}
                className="flex items-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <Square className="h-4 w-4" />
                    Stop Playback
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Play Recording
                  </>
                )}
              </Button>
              <Button 
                size="sm" 
                onClick={startRecording}
                className="flex items-center gap-2"
              >
                <Mic className="h-4 w-4" />
                Record New
              </Button>
            </>
          ) : (
            <Button 
              onClick={startRecording}
              className="flex items-center gap-2"
            >
              <Mic className="h-4 w-4" />
              Start Voice Recording
            </Button>
          )}
        </div>
        
        {/* Analysis Results */}
        {audioAnalysis && (
          <div className="mt-4 p-4 bg-secondary/30 rounded-md">
            <h4 className="font-medium mb-2">Voice Analysis</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Average Frequency:</p>
                <p className="font-medium">{audioAnalysis.MDVP_Fo ? audioAnalysis.MDVP_Fo.toFixed(2) : 'N/A'} Hz</p>
              </div>
              <div>
                <p className="text-muted-foreground">Jitter:</p>
                <p className="font-medium">{audioAnalysis.MDVP_Jitter ? (audioAnalysis.MDVP_Jitter * 100).toFixed(4) : 'N/A'}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Shimmer:</p>
                <p className="font-medium">{audioAnalysis.MDVP_Shimmer ? (audioAnalysis.MDVP_Shimmer * 100).toFixed(2) : 'N/A'}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">HNR:</p>
                <p className="font-medium">{audioAnalysis.HNR ? audioAnalysis.HNR.toFixed(2) : 'N/A'} dB</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground mt-2 text-center">
          Voice analysis helps detect subtle vocal pattern changes that are often early indicators of Parkinson's disease.
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedVoiceRecorder;
