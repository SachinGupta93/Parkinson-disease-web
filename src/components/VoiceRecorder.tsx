
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { analyzeVoiceRecording } from "@/utils/parkinsonPredictor";

interface VoiceRecorderProps {
  onVoiceAnalyzed?: (voiceData: any) => void;
  onVoiceRecorded?: (file: File) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onVoiceAnalyzed, onVoiceRecorded }) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });
      
      mediaRecorder.addEventListener("stop", handleRecordingStop);
      
      mediaRecorder.start();
      setIsRecording(true);
      
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
      
      setIsRecording(false);
    }
  };
  
  const handleRecordingStop = async () => {
    if (audioChunksRef.current.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      
      // If onVoiceRecorded is provided, create a File from the Blob and call it
      if (onVoiceRecorded) {
        const audioFile = new File([audioBlob], "voice-recording.wav", { type: 'audio/wav' });
        onVoiceRecorded(audioFile);
        toast.success("Voice recording captured successfully");
      } 
      // If onVoiceAnalyzed is provided, analyze the voice recording
      else if (onVoiceAnalyzed) {
        // Analyze voice recording (in a real app, this would send to backend)
        const voiceFeatures = await analyzeVoiceRecording(audioBlob);
        
        onVoiceAnalyzed(voiceFeatures);
        toast.success("Voice recording analyzed successfully");
      }
    } catch (error) {
      console.error("Error processing voice recording:", error);
      toast.error("Failed to process voice recording. Please try again.");
    } finally {
      setIsProcessing(false);
      setRecordingTime(0);
    }
  };
  
  return (
    <Card className="shadow-md border-primary/20">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-1">Voice Analyzer</h3>
            <p className="text-sm text-muted-foreground">
              Record your voice saying "aaah" for up to 10 seconds
            </p>
          </div>
          
          <div className="w-full flex flex-col items-center justify-center space-y-4">
            {isRecording ? (
              <div className="space-y-2 text-center">
                <div className="flex items-center gap-2 justify-center">
                  <span className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="font-mono">Recording: {recordingTime}s</span>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={stopRecording}
                >
                  Stop Recording
                </Button>
              </div>
            ) : isProcessing ? (
              <div className="flex items-center gap-2 justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-t-transparent border-primary"></div>
                <span>Processing voice...</span>
              </div>
            ) : (
              <>
                <Button 
                  onClick={startRecording}
                  className="flex items-center gap-2"
                >
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                  Start Voice Recording
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Or</p>
                  <input
                    type="file"
                    id="voice-file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && onVoiceRecorded) {
                        setIsProcessing(true);
                        onVoiceRecorded(file);
                      }
                    }}
                  />
                  <label htmlFor="voice-file">
                    <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                      <span>Upload Audio File</span>
                    </Button>
                  </label>
                </div>
              </>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground mt-4 text-center">
            Voice analysis helps detect subtle vocal pattern changes that may indicate Parkinson's disease.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceRecorder;
