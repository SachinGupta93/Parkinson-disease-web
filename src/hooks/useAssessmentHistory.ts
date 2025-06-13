import { useState, useEffect, useContext } from 'react';
import { Assessment, getAssessmentHistory, saveAssessment, clearAssessmentHistory } from '@/utils/assessmentHistory';
import { UserContext } from '@/App';
import { ParkinsonsFeatures } from "@/utils/parkinsonPredictor";

export function useAssessmentHistory() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(UserContext);
  
  useEffect(() => {
    const loadAssessments = async () => {
      setLoading(true);
      const history = await getAssessmentHistory(user?.id);
      setAssessments(history);
      setLoading(false);
    };
    
    loadAssessments();
  }, [user]);
  
  const addAssessment = async (
    features: ParkinsonsFeatures, 
    result: Assessment["result"],
    allModelResults?: Assessment["allModelResults"]
  ) => {
    const id = await saveAssessment(features, result, allModelResults, user?.id);
    const newHistory = await getAssessmentHistory(user?.id);
    setAssessments(newHistory);
    return id;
  };
  
  const clear = async () => {
    await clearAssessmentHistory(user?.id);
    setAssessments([]);
  };
  
  return {
    assessments,
    loading,
    addAssessment,
    clear
  };
}
