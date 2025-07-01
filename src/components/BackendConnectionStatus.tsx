import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { AlertCircle, CheckCircle, RefreshCcw } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface BackendConnectionStatusProps {
  isConnected?: boolean | null;
  onRetry?: () => void;
}

export const BackendConnectionStatus: React.FC<BackendConnectionStatusProps> = ({ 
  isConnected,
  onRetry
}) => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [isRetrying, setIsRetrying] = useState(false);

  const checkConnection = async () => {
    try {
      setStatus('checking');
      await axios.get(`${API_URL}/`);
      setStatus('connected');
    } catch (error) {
      console.error('Backend connection failed:', error);
      setStatus('disconnected');
    }
  };

  useEffect(() => {
    // Only perform independent checks if isConnected prop isn't provided
    if (isConnected === undefined) {
      checkConnection();
      // Check connection every 30 seconds
      const interval = setInterval(checkConnection, 30000);
      return () => clearInterval(interval);
    } else {
      // Use the provided connection status
      setStatus(isConnected === true ? 'connected' : 
              isConnected === false ? 'disconnected' : 'checking');
    }
  }, [isConnected]);

  const handleRetry = async () => {
    setIsRetrying(true);
    if (onRetry) {
      await onRetry();
    } else {
      await checkConnection();
    }
    setIsRetrying(false);
  };

  return (
    <div className="flex items-center gap-2">
      {status === 'connected' ? (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Backend Connected
        </Badge>
      ) : status === 'disconnected' ? (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Backend Disconnected
          <button 
            onClick={handleRetry} 
            className="ml-1 p-1 hover:bg-red-100 rounded-full"
            disabled={isRetrying}
          >
            <RefreshCcw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
          </button>
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <RefreshCcw className="h-3 w-3 mr-1 animate-spin" />
          Checking Connection
        </Badge>
      )}
    </div>
  );
};
