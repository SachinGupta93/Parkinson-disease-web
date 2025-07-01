import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, off, get } from 'firebase/database';
import { database, realtimeDb } from '@/lib/firebase';
import { VoiceAnalysisService } from '@/services/userDataService';

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

interface RealtimeDataState {
  data: VoiceMetrics | null;
  loading: boolean;
  error: Error | null;
  lastUpdated: number | null;
  isConnected: boolean;
}

export const useRealtimeData = (userId: string) => {
  const [state, setState] = useState<RealtimeDataState>({
    data: null,
    loading: true,
    error: null,
    lastUpdated: null,
    isConnected: false
  });

  // Validate user ID
  const validateUserId = useCallback((uid: string): boolean => {
    if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
      console.error('useRealtimeData: Invalid user ID provided');
      return false;
    }
    return true;
  }, []);

  // Handle realtime data updates
  const handleRealtimeUpdate = useCallback((snapshot: any) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      
      // Verify this data belongs to the correct user
      if (data.userId && data.userId !== userId) {
        console.warn('useRealtimeData: Received data for wrong user, ignoring');
        return;
      }

      console.log('useRealtimeData: Realtime update received:', data);
      
      setState(prev => ({
        ...prev,
        data: data.voiceMetrics || data,
        lastUpdated: data.lastUpdated || Date.now(),
        isConnected: true,
        loading: false,
        error: null
      }));
    } else {
      console.log('useRealtimeData: No data in snapshot');
      setState(prev => ({
        ...prev,
        data: null,
        lastUpdated: null,
        loading: false,
        error: null
      }));
    }
  }, [userId]);

  // Handle connection errors
  const handleConnectionError = useCallback((error: any) => {
    console.error('useRealtimeData: Connection error:', error);
    setState(prev => ({
      ...prev,
      error: error,
      isConnected: false,
      loading: false
    }));
  }, []);

  useEffect(() => {
    if (!validateUserId(userId)) {
      console.log("useRealtimeData: Invalid userId provided, skipping data loading");
      setState(prev => ({ ...prev, loading: false, error: new Error('Invalid user ID') }));
      return;
    }
    
    console.log(`useRealtimeData: Setting up secure listener for user ${userId}`);

    // Use the new secure user data service
    const unsubscribe = VoiceAnalysisService.subscribeToRealtimeData(userId, (data) => {
      if (data) {
        setState(prev => ({
          ...prev,
          data: data.voiceMetrics,
          lastUpdated: data.lastUpdated,
          isConnected: true,
          loading: false,
          error: null
        }));
      } else {
        setState(prev => ({
          ...prev,
          data: null,
          lastUpdated: null,
          loading: false,
          error: null
        }));
      }
    });

    // Cleanup function
    return () => {
      console.log(`useRealtimeData: Cleaning up listener for user ${userId}`);
      unsubscribe();
    };
  }, [userId, validateUserId]);

  return { 
    data: state.data, 
    loading: state.loading, 
    error: state.error,
    lastUpdated: state.lastUpdated,
    isConnected: state.isConnected
  };
}; 