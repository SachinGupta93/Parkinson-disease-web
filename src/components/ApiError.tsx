import React from 'react';
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ApiErrorProps {
  error: Error | null;
  retry?: () => void;
  message?: string;
}

const ApiError: React.FC<ApiErrorProps> = ({ 
  error, 
  retry,
  message = "We're having trouble connecting to the analysis server"
}) => {
  const isCorsError = error && 
    (error.message.includes('CORS') || 
    error.message.includes('Network Error') ||
    error.message.includes('ERR_NETWORK'));

  return (
    <Card className="w-full max-w-md mx-auto border-red-100 shadow-md">
      <CardHeader className="bg-red-50 border-b border-red-100">
        <CardTitle className="flex items-center text-red-700 gap-2">
          {isCorsError ? <WifiOff size={20} /> : <AlertCircle size={20} />}
          Connection Error
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 pb-4 space-y-4">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="bg-red-50 rounded-full p-3">
            {isCorsError ? (
              <WifiOff size={40} className="text-red-500" />
            ) : (
              <AlertCircle size={40} className="text-red-500" />
            )}
          </div>
          <p className="text-gray-700 font-medium">{message}</p>
          <p className="text-sm text-gray-500">
            {isCorsError
              ? "This could be due to the backend server being offline or CORS settings not allowing connections."
              : error?.message || "Something went wrong while processing your request."}
          </p>
        </div>
        
        <div className="bg-amber-50 border-l-4 border-amber-300 p-3 text-xs text-amber-700">
          <p className="font-medium">Troubleshooting steps:</p>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Make sure the backend server is running</li>
            <li>Check that CORS settings allow connections from this domain</li>
            <li>Verify your internet connection</li>
          </ol>
        </div>
      </CardContent>
      
      {retry && (
        <CardFooter className="bg-gray-50 border-t">
          <Button 
            onClick={retry}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} className="animate-spin-slow" />
            Try Again
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ApiError;
