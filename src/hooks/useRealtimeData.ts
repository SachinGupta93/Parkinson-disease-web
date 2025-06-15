import { useState, useEffect } from 'react';
import { ref, onValue, off, get } from 'firebase/database';
import { database, realtimeDb } from '@/lib/firebase';

// Define interfaces for the data structure
interface VoiceMetrics {
  pitch?: number;
  jitter?: number;
  shimmer?: number;
  hnr?: number;
  tremor?: number;
  amplitude?: number;
  frequency?: number;
  [key: string]: any;
}

interface VoiceHistoryEntry {
  timestamp: number;
  voice_metrics?: VoiceMetrics;
  voiceMetrics?: VoiceMetrics;
  prediction?: {
    severity?: number;
    confidence?: number;
    status?: boolean;
    model_predictions?: Record<string, number>;
    model_probabilities?: Record<string, number>;
  };
  [key: string]: any;
}

export const useRealtimeData = (userId: string) => {
  const [data, setData] = useState<VoiceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      console.log("useRealtimeData: No userId provided, skipping data loading");
      setLoading(false);
      return;
    }
    
    console.log(`useRealtimeData: Setting up listener for user ${userId}`);
    
    // Try multiple possible paths for realtime user voice data
    const possiblePaths = [
      `users/${userId}/realtime`,
      `users/${userId}/voiceHistory/latest`,
      `users/${userId}/voiceHistory`
    ];
    
    // Function to try each path in sequence
    const tryNextPath = async (pathIndex: number) => {
      if (pathIndex >= possiblePaths.length) {
        console.log("useRealtimeData: All paths tried, no data found");
        setLoading(false);
        setData(null);
        return;
      }
      
      const path = possiblePaths[pathIndex];
      console.log(`useRealtimeData: Trying path ${path}`);
      
      try {
        const dataRef = ref(realtimeDb, path);
        const snapshot = await get(dataRef);
        
        if (snapshot.exists()) {
          console.log(`useRealtimeData: Data found at ${path}:`, snapshot.val());
          
          // Handle different data structures
          if (path === `users/${userId}/voiceHistory`) {
            // If this is the voice history path, get the most recent entry
            const historyData = snapshot.val() as Record<string, VoiceHistoryEntry>;
            const entries = Object.entries(historyData);
            
            if (entries.length > 0) {
              // Sort by timestamp to get the most recent
              entries.sort((a, b) => {
                const entryA = a[1] as VoiceHistoryEntry;
                const entryB = b[1] as VoiceHistoryEntry;
                const timestampA = entryA.timestamp || 0;
                const timestampB = entryB.timestamp || 0;
                return timestampB - timestampA;
              });
              
              const latestEntry = entries[0][1] as VoiceHistoryEntry;
              console.log("useRealtimeData: Using latest voice history entry:", latestEntry);
              
              // Extract voice metrics
              if (latestEntry.voice_metrics) {
                const metrics: VoiceMetrics = {
                  pitch: typeof latestEntry.voice_metrics.pitch === 'number' ? latestEntry.voice_metrics.pitch : 0,
                  jitter: typeof latestEntry.voice_metrics.jitter === 'number' ? latestEntry.voice_metrics.jitter : 0,
                  shimmer: typeof latestEntry.voice_metrics.shimmer === 'number' ? latestEntry.voice_metrics.shimmer : 0,
                  hnr: typeof latestEntry.voice_metrics.hnr === 'number' ? latestEntry.voice_metrics.hnr : 0
                };
                setData(metrics);
              } else if (latestEntry.voiceMetrics) {
                const metrics: VoiceMetrics = {
                  pitch: typeof latestEntry.voiceMetrics.pitch === 'number' ? latestEntry.voiceMetrics.pitch : 0,
                  tremor: typeof latestEntry.voiceMetrics.tremor === 'number' ? latestEntry.voiceMetrics.tremor : 0,
                  amplitude: typeof latestEntry.voiceMetrics.amplitude === 'number' ? latestEntry.voiceMetrics.amplitude : 0,
                  frequency: typeof latestEntry.voiceMetrics.frequency === 'number' ? latestEntry.voiceMetrics.frequency : 0
                };
                setData(metrics);
              } else {
                // Try next path if no voice metrics found
                tryNextPath(pathIndex + 1);
                return;
              }
            } else {
              // Try next path if no entries found
              tryNextPath(pathIndex + 1);
              return;
            }
          } else {
            // For other paths, use the data directly
            const realtimeData = snapshot.val() as VoiceMetrics;
            setData(realtimeData);
          }
          
          setLoading(false);
          
          // Set up realtime listener for this path
          const unsubscribe = onValue(
            dataRef, 
            (realtimeSnapshot) => {
              console.log(`useRealtimeData: Realtime update received:`, realtimeSnapshot.val());
              const newData = realtimeSnapshot.val();
              
              if (newData) {
                // Handle different data structures as above
                if (path === `users/${userId}/voiceHistory`) {
                  const historyData = newData as Record<string, VoiceHistoryEntry>;
                  const entries = Object.entries(historyData);
                  
                  if (entries.length > 0) {
                    entries.sort((a, b) => {
                      const entryA = a[1] as VoiceHistoryEntry;
                      const entryB = b[1] as VoiceHistoryEntry;
                      const timestampA = entryA.timestamp || 0;
                      const timestampB = entryB.timestamp || 0;
                      return timestampB - timestampA;
                    });
                    
                    const latestEntry = entries[0][1] as VoiceHistoryEntry;
                    
                    if (latestEntry.voice_metrics) {
                      const metrics: VoiceMetrics = {
                        pitch: typeof latestEntry.voice_metrics.pitch === 'number' ? latestEntry.voice_metrics.pitch : 0,
                        jitter: typeof latestEntry.voice_metrics.jitter === 'number' ? latestEntry.voice_metrics.jitter : 0,
                        shimmer: typeof latestEntry.voice_metrics.shimmer === 'number' ? latestEntry.voice_metrics.shimmer : 0,
                        hnr: typeof latestEntry.voice_metrics.hnr === 'number' ? latestEntry.voice_metrics.hnr : 0
                      };
                      setData(metrics);
                    } else if (latestEntry.voiceMetrics) {
                      const metrics: VoiceMetrics = {
                        pitch: typeof latestEntry.voiceMetrics.pitch === 'number' ? latestEntry.voiceMetrics.pitch : 0,
                        tremor: typeof latestEntry.voiceMetrics.tremor === 'number' ? latestEntry.voiceMetrics.tremor : 0,
                        amplitude: typeof latestEntry.voiceMetrics.amplitude === 'number' ? latestEntry.voiceMetrics.amplitude : 0,
                        frequency: typeof latestEntry.voiceMetrics.frequency === 'number' ? latestEntry.voiceMetrics.frequency : 0
                      };
                      setData(metrics);
                    }
                  }
                } else {
                  const realtimeData = newData as VoiceMetrics;
                  setData(realtimeData);
                }
              } else {
                setData(null);
              }
            },
            (error) => {
              console.error(`useRealtimeData: Realtime listener error:`, error);
              setError(error);
            }
          );
          
          return () => {
            console.log(`useRealtimeData: Cleaning up listener for ${path}`);
            unsubscribe();
          };
        } else {
          console.log(`useRealtimeData: No data found at ${path}, trying next path`);
          tryNextPath(pathIndex + 1);
        }
      } catch (err) {
        console.error(`useRealtimeData: Error fetching data from ${path}:`, err);
        tryNextPath(pathIndex + 1);
      }
    };
    
    // Start trying paths
    tryNextPath(0);
    
    // Return a cleanup function
    return () => {
      console.log("useRealtimeData: Cleaning up");
      // Cleanup will be handled by the inner function
    };
  }, [userId]);

  return { data, loading, error };
}; 