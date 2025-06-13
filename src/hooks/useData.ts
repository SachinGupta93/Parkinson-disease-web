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
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      // Track if we've successfully loaded at least one data type
      let hasLoadedSomeData = false;
      
      // Load each data type separately to prevent one failure from affecting others
      try {
        const voiceData = await getUserVoiceHistory(userId);
        setVoiceHistory(voiceData);
        hasLoadedSomeData = true;
      } catch (voiceErr: any) {
        console.error("Error loading voice history:", voiceErr);
      }
      
      try {
        const historyData = await getUserHistory(userId);
        setUserHistory(historyData);
        hasLoadedSomeData = true;
      } catch (historyErr: any) {
        console.error("Error loading user history:", historyErr);
      }
      
      try {
        const graphs = await getGraphData(userId);
        setGraphData(graphs);
        hasLoadedSomeData = true;
      } catch (graphErr: any) {
        console.error("Error loading graph data:", graphErr);
      }
      
      // If all requests failed, set a generic error
      if (!hasLoadedSomeData) {
        setError("Could not load user data. Please check your connection and permissions.");
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