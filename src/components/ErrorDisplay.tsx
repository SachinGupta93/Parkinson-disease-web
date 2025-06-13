import React from 'react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import { Button } from './ui/button';

interface ErrorDisplayProps {
  error: Error | string | null;
  onRetry?: () => void;
  title?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  title = 'Error'
}) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Handle specific API errors
  const isNetworkError = errorMessage.includes('Network Error') || 
                        errorMessage.includes('Failed to fetch');
  const isAuthError = errorMessage.includes('Authentication failed') ||
                     errorMessage.includes('403');
  const isRateLimitError = errorMessage.includes('Too many requests') || 
                          errorMessage.includes('429');

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <div>
          {isNetworkError ? (
            <>
              <XCircle className="inline mr-2 h-4 w-4" />
              Cannot connect to the analysis server. Please check your connection.
            </>
          ) : isAuthError ? (
            <>
              <XCircle className="inline mr-2 h-4 w-4" />
              Authorization error. Please check your API key or login again.
            </>
          ) : isRateLimitError ? (
            <>
              <XCircle className="inline mr-2 h-4 w-4" />
              Too many requests. Please wait a moment before trying again.
            </>
          ) : (
            errorMessage
          )}
        </div>
        
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            className="self-start" 
            onClick={onRetry}
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
