import React, { useState, useEffect, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import MainNav from './MainNav';
import { BackendConnectionStatus } from './BackendConnectionStatus';
import { Toaster } from 'sonner';
import axios from 'axios';
import { toast } from 'sonner';
import ApiError from './ApiError';
import { LoadingScreen } from './LoadingScreen';
import GeminiBot from './GeminiBot';

const Layout = () => {
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  // Get API URL with consistent format
  const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  // Remove trailing /api/v1 if it exists to avoid double paths
  const apiUrl = baseApiUrl.endsWith('/api/v1') 
    ? baseApiUrl 
    : baseApiUrl;
  const apiKey = useMemo(() => import.meta.env.VITE_API_KEY || 'your-secure-api-key', []); // Memoize API Key

  // Check connection to backend on mount
  useEffect(() => {
    console.log("Connecting to backend at:", apiUrl);
    
    const checkBackendConnection = async () => {
      setIsCheckingConnection(true);
      try {
        // Try different health check endpoints
        try {
          // First try with /api/v1/health
          await axios.get(`${apiUrl}/api/v1/health`, {
            timeout: 5000,
            headers: { 'X-API-Key': apiKey }
          });
        } catch (firstError) {
          console.log("First health check attempt failed, trying root endpoint");
          try {
            // If that fails, try the root endpoint
            await axios.get(`${apiUrl}/`, {
              timeout: 5000,
              headers: { 'X-API-Key': apiKey }
            });
          } catch (secondError) {
            console.log("Root endpoint failed, trying test endpoint without auth");
            // If that fails too, try the test endpoint without authentication
            await axios.get(`${apiUrl}/test`, {
              timeout: 5000
            });
          }
        }
        
        setIsBackendConnected(true);
        setConnectionError(null);
        console.log("Successfully connected to backend");
      } catch (error) {
        console.error('Error connecting to backend:', error);
        setIsBackendConnected(false);
        setConnectionError(error instanceof Error ? error : new Error('Connection failed'));
        toast.error('Unable to connect to analysis server', { 
          description: 'Some features may be limited or using mock data.',
          duration: 5000
        });
      } finally {
        setIsCheckingConnection(false);
      }
    };
    
    checkBackendConnection();
    
    // Set up interval to periodically check connection (reduced frequency)
    const interval = setInterval(checkBackendConnection, 300000); // Check every 5 minutes instead of 1 minute
    
    return () => clearInterval(interval);
  }, [apiUrl]); // Removed apiKey from dependency array since it's now memoized

  const retryConnection = async () => {
    setConnectionError(null);
    setIsCheckingConnection(true);
    try {
      // Try different health check endpoints
      try {
        // First try with /api/v1/health
        await axios.get(`${apiUrl}/api/v1/health`, {
          timeout: 5000,
          headers: { 'X-API-Key': apiKey }
        });
      } catch (firstError) {
        console.log("First health check attempt failed, trying root endpoint");
        try {
          // If that fails, try the root endpoint
          await axios.get(`${apiUrl}/`, {
            timeout: 5000,
            headers: { 'X-API-Key': apiKey }
          });
        } catch (secondError) {
          console.log("Root endpoint failed, trying test endpoint without auth");
          // If that fails too, try the test endpoint without authentication
          await axios.get(`${apiUrl}/test`, {
            timeout: 5000
          });
        }
      }
      
      setIsBackendConnected(true);
      setConnectionError(null);
      toast.success('Connected to analysis server');
      console.log("Successfully connected to backend");
    } catch (error) {
      console.error('Error connecting to backend:', error);
      setIsBackendConnected(false);
      setConnectionError(error instanceof Error ? error : new Error('Connection failed'));
    } finally {
      setIsCheckingConnection(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-slate-900">
      <Toaster position="top-right" richColors />
      <MainNav />
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-end">
          <BackendConnectionStatus 
            isConnected={isBackendConnected} 
            onRetry={retryConnection} 
          />
        </div>
      </div>
      <main className="container mx-auto px-4 py-6 flex-grow flex flex-col">
        {/* Add GeminiBot component */}
        <GeminiBot />
        {isCheckingConnection ? (
          <div className="py-8 flex-grow flex items-center justify-center">
            <LoadingScreen message="Connecting to analysis server..." />
          </div>
        ) : connectionError && !isBackendConnected ? (
          <div className="py-8 flex-grow flex flex-col items-center justify-center">
            <ApiError 
              error={connectionError}
              retry={retryConnection}
              message="Unable to connect to the Parkinson's analysis server"
            />
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 mb-4">
                You can still browse the application, but voice analysis features will be limited.
              </p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex-grow"
              >
                <Outlet />
              </motion.div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-grow flex flex-col"
          >
            <Outlet />
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Layout;
