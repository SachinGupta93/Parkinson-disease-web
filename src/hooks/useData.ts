import { useState, useEffect } from 'react';
import { 
  saveVoiceAnalysis,
  getUserVoiceHistory,
  saveGraphData,
  getGraphData,
  saveUserHistory,
  getUserHistory,
  VoiceAnalysisData,
  UserHistory
} from '@/services/dataService';

export const useData = (userId: string) => {
  const [voiceHistory, setVoiceHistory] = useState<VoiceAnalysisData[]>([]);
  const [userHistory, setUserHistory] = useState<UserHistory[]>([]);
  const [graphData, setGraphData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);  // Load initial data
  useEffect(() => {
    // Clear data when userId changes
    setVoiceHistory([]);
    setUserHistory([]);
    setGraphData([]);
    setError(null);
    
    const loadData = async () => {
      if (!userId) {
        console.log("useData: No userId provided, skipping data loading");
        setLoading(false);
        return;
      }
      
      console.log(`useData: Loading data for user ${userId}`);
      setLoading(true);
      
      // Track if we've successfully loaded at least one data type
      let hasLoadedSomeData = false;
      
      // Load each data type separately to prevent one failure from affecting others
      try {
        console.log(`useData: Fetching voice history for user ${userId}`);
        const voiceData = await getUserVoiceHistory(userId);
        console.log(`useData: Received voice history:`, voiceData);
        console.log(`useData: Voice history length:`, voiceData?.length || 0);
        
        if (voiceData && voiceData.length > 0) {
          console.log(`useData: First voice history entry:`, voiceData[0]);
          setVoiceHistory(voiceData);
          hasLoadedSomeData = true;
        } else {
          console.log(`useData: No voice history data found for user ${userId}`);
          setVoiceHistory([]);
        }
      } catch (voiceErr: any) {
        console.error("Error loading voice history:", voiceErr);
        setVoiceHistory([]);
      }
      
      try {
        console.log(`useData: Fetching user history for user ${userId}`);
        const historyData = await getUserHistory(userId);
        console.log(`useData: Received user history:`, historyData);
        setUserHistory(historyData);
        hasLoadedSomeData = true;
      } catch (historyErr: any) {
        console.error("Error loading user history:", historyErr);
      }
      
      try {
        console.log(`useData: Fetching graph data for user ${userId}`);
        const graphs = await getGraphData(userId);
        console.log(`useData: Received graph data:`, graphs);
        setGraphData(graphs);
        hasLoadedSomeData = true;
      } catch (graphErr: any) {
        console.error("Error loading graph data:", graphErr);
      }
      
      // If all requests failed, set a generic error
      if (!hasLoadedSomeData) {
        console.error("useData: All data loading requests failed");
        setError("Could not load user data. Please check your connection and permissions.");
        // Clear all data to ensure we're not using stale or dummy data
        setVoiceHistory([]);
        setUserHistory([]);
        setGraphData([]);
      } else {
        console.log("useData: Successfully loaded at least some data");
      }
      
      setLoading(false);
    };

    loadData();
    
    // Return cleanup function
    return () => {
      // Cancel any pending operations if needed
    };
  }, [userId]);

  // Save voice analysis
  const saveVoiceData = async (data: Omit<VoiceAnalysisData, 'userId'>) => {
    try {
      setError(null);
      const id = await saveVoiceAnalysis(userId, data);
      const newData = { ...data, userId, id };
      setVoiceHistory(prev => [newData, ...prev]);
      return id;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Save graph data
  const saveGraph = async (data: any) => {
    try {
      setError(null);
      await saveGraphData(userId, data);
      setGraphData(prev => [...prev, { ...data, timestamp: Date.now() }]);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Save user history
  const saveHistory = async (history: Omit<UserHistory, 'id' | 'userId'>) => {
    try {
      setError(null);
      const id = await saveUserHistory({ ...history, userId });
      const newHistory = { ...history, id, userId };
      setUserHistory(prev => [newHistory, ...prev]);
      return id;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    voiceHistory,
    userHistory,
    graphData,
    loading,
    error,
    saveVoiceData,
    saveGraph,
    saveHistory
  };
}; 