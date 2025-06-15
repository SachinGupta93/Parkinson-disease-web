import React, { useState, useRef, useEffect } from "react";
import { audioBufferToWav, validateWavFile } from "@/utils/audioUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { apiService, CompleteVoiceData } from "@/services/api";
import {
  Mic,
  Square,
  Play,
  Volume
} from "lucide-react";

// Add WebKit AudioContext type definition
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

interface EnhancedVoiceRecorderProps {
  onVoiceAnalyzed: (voiceData: CompleteVoiceData) => void;
}

const EnhancedVoiceRecorder: React.FC<EnhancedVoiceRecorderProps> = ({ onVoiceAnalyzed }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isAnalysisError, setIsAnalysisError] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioAnalysis, setAudioAnalysis] = useState<CompleteVoiceData | null>(null);
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
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                sampleRate: 44100,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true
            }
        });
        
        // Set up audio visualization
        setupAudioVisualization(stream);
        
        // Try to use WAV format first, fallback to WebM if not supported
        let options: MediaRecorderOptions;
        if (MediaRecorder.isTypeSupported('audio/wav')) {
            options = { mimeType: 'audio/wav' };
            console.log('Using audio format: audio/wav');
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm' };
            console.log('Using audio format: audio/webm (will convert to WAV)');
        } else {
            // Fallback to default
            options = {};
            console.log('Using default audio format (will convert to WAV)');
        }
        
        mediaRecorderRef.current = new MediaRecorder(stream, options);
        audioChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };
        
        mediaRecorderRef.current.onstop = async () => {
            try {
                // Convert to WAV format for consistent backend processing
                await convertAndAnalyzeRecording();
            } catch (error) {
                console.error('Error processing recording:', error);
                setIsAnalysisError(true);
                toast.error('Error processing recording. Please try again.');
            }
        };
        
        mediaRecorderRef.current.start();
        setIsRecording(true);
        startTimer();
        
    } catch (error) {
        console.error('Error starting recording:', error);
        toast.error('Could not access microphone. Please check your permissions.');
    }
};

const convertAndAnalyzeRecording = async () => {
    setIsProcessing(true);
    setIsAnalysisError(false);
    
    try {
        if (audioChunksRef.current.length === 0) {
            throw new Error('No audio data recorded');
        }

        // Get the MIME type from the recorder
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        console.log(`Processing audio with MIME type: ${mimeType}`);
        
        // Create initial blob from recorded chunks
        const recordedBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        let finalAudioBlob: Blob;
        let fileName: string;
        
        // If it's already WAV, use it directly
        if (mimeType.includes('wav')) {
            finalAudioBlob = recordedBlob;
            fileName = 'voice-recording.wav';
            console.log('Using recorded WAV directly');
        } else {
            // Convert to WAV using Web Audio API
            console.log('Converting audio to WAV format...');
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const arrayBuffer = await recordedBlob.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                
                // Convert to WAV
                const wavBuffer = audioBufferToWav(audioBuffer);
                finalAudioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
                fileName = 'voice-recording.wav';
                
                // Close audio context to free resources
                await audioContext.close();
                console.log('Successfully converted to WAV format');
            } catch (conversionError) {
                console.error('Error converting to WAV:', conversionError);
                // Fallback: use original blob but with proper filename
                finalAudioBlob = recordedBlob;
                fileName = mimeType.includes('webm') ? 'voice-recording.webm' : 'voice-recording.audio';
                console.log('Using original format as fallback');
            }
        }
        
        // Create audio URL for playback
        const url = URL.createObjectURL(finalAudioBlob);
        setAudioUrl(url);
        
        // Create File object for API
        const audioFile = new File([finalAudioBlob], fileName, { 
            type: finalAudioBlob.type,
            lastModified: Date.now()
        });
        
        console.log('FRONTEND: Starting voice analysis with file:', {
            name: audioFile.name,
            type: audioFile.type,
            size: audioFile.size
        });

        // Analyze the voice file
        const voiceData = await apiService.analyzeVoiceFile(audioFile);
        
        // Validate voice data
        if (!voiceData || !Object.keys(voiceData).length) {
            throw new Error('Voice analysis returned empty or invalid data');
        }

        // Check for critical features
        const criticalFeatures = ['MDVP_Fo', 'MDVP_Jitter', 'MDVP_Shimmer', 'HNR'];
        const missingFeatures = criticalFeatures.filter(
            feature => typeof voiceData[feature as keyof typeof voiceData] !== 'number'
        );

        if (missingFeatures.length > 0) {
            console.warn(`Some voice features are missing: ${missingFeatures.join(', ')}`);
            // Don't throw error, just log warning as backend provides defaults
        }

        console.log('FRONTEND: Voice analysis successful:', voiceData);
        setAudioAnalysis(voiceData);
        onVoiceAnalyzed(voiceData);
        toast.success('Voice analysis completed successfully');
        
    } catch (error) {
        console.error('FRONTEND: Error in voice analysis:', error);
        setIsAnalysisError(true);

        let errorMessage = 'Error analyzing voice recording. ';
        
        if (error instanceof Error) {
            if (error.message.includes('No audio data recorded')) {
                errorMessage = 'No audio was recorded. Please try again.';
            } else if (error.message.includes('Unsupported audio format')) {
                errorMessage = 'This audio format is not supported. Please try using a different browser.';
            } else if (error.message.includes('Network')) {
                errorMessage = 'Could not connect to the server. Please check your internet connection.';
            } else {
                errorMessage = error.message;
            }
        }

        toast.error(errorMessage);
        
    } finally {
        setIsProcessing(false);
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
  


  // Timer function to update recording time
  const startTimer = () => {
    if (timerRef.current) return;
    
    timerRef.current = window.setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
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
