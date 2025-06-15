import { useState, useEffect, useContext } from 'react';
import { Assessment, getAssessmentHistory, saveAssessment, clearAssessmentHistory } from '@/utils/assessmentHistory';
import { UserContext } from '@/App';
import { ParkinsonsFeatures } from "@/types";

export function useAssessmentHistory() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(UserContext);
  
  useEffect(() => {
    const loadAssessments = async () => {
      setLoading(true);
      
      try {
        console.log("useAssessmentHistory: Loading assessments for user:", user?.id);
        const history = await getAssessmentHistory(user?.id);
        console.log("useAssessmentHistory: Loaded assessment history:", history);
        
        if (history && Array.isArray(history)) {
          setAssessments(history);
        } else {
          console.warn("useAssessmentHistory: Invalid assessment history format, using empty array");
          setAssessments([]);
        }
      } catch (error) {
        console.error("useAssessmentHistory: Error loading assessments:", error);
        setAssessments([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadAssessments();
  }, [user]);
  
  const addAssessment = async (
    features: ParkinsonsFeatures, 
    result: Assessment["result"],
    allModelResults?: Assessment["allModelResults"]
  ) => {
    try {
      console.log("useAssessmentHistory: Adding new assessment with features:", features);
      const id = await saveAssessment(features, result, allModelResults, user?.id);
      console.log("useAssessmentHistory: Assessment saved with ID:", id);
      
      // Reload the assessment history to include the new assessment
      const newHistory = await getAssessmentHistory(user?.id);
      console.log("useAssessmentHistory: Updated assessment history:", newHistory);
      
      if (newHistory && Array.isArray(newHistory)) {
        setAssessments(newHistory);
      }
      
      return id;
    } catch (error) {
      console.error("useAssessmentHistory: Error adding assessment:", error);
      throw error;
    }
  };
  
  const clear = async () => {
    try {
      console.log("useAssessmentHistory: Clearing assessment history for user:", user?.id);
      await clearAssessmentHistory(user?.id);
      setAssessments([]);
      console.log("useAssessmentHistory: Assessment history cleared");
    } catch (error) {
      console.error("useAssessmentHistory: Error clearing assessment history:", error);
      throw error;
    }
  };
  
  return {
    assessments,
    loading,
    addAssessment,
    clear
  };
}
