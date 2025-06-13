import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';

export const useRealtimeData = (userId: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    // Path for realtime user voice data
    const path = `users/${userId}/realtime`;
    const dataRef = ref(database, path);
    
    const handleData = (snapshot: any) => {
      setData(snapshot.val());
      setLoading(false);
    };

    const handleError = (error: Error) => {
      setError(error);
      setLoading(false);
    };

    onValue(dataRef, handleData, handleError);

    return () => {
      off(dataRef);
    };
  }, [userId]);

  return { data, loading, error };
}; 