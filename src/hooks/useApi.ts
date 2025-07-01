import { useState, useCallback } from 'react';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'sonner';

// Define the base API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface UseApiOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useApi<ResponseType = unknown>(options: UseApiOptions = {}) {
  const { showSuccessToast = false, showErrorToast = true } = options;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<ResponseType | null>(null);

  // Create an axios instance with default headers
  const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': import.meta.env.VITE_API_KEY || 'your-secure-api-key'
    },
    timeout: 10000 // 10 seconds
  });

  const request = useCallback(async <T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    requestData?: any,
    config?: AxiosRequestConfig
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      let response: AxiosResponse<T>;

      switch (method) {
        case 'GET':
          response = await apiClient.get<T>(endpoint, config);
          break;
        case 'POST':
          response = await apiClient.post<T>(endpoint, requestData, config);
          break;
        case 'PUT':
          response = await apiClient.put<T>(endpoint, requestData, config);
          break;
        case 'DELETE':
          response = await apiClient.delete<T>(endpoint, config);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      const typedData = response.data;
      setData(typedData as unknown as ResponseType);
      
      if (showSuccessToast) {
        toast.success('Request successful', {
          description: 'The operation completed successfully'
        });
      }
      
      return typedData;
    } catch (err) {
      const axiosError = err as AxiosError;
      setError(axiosError);
      
      const isNetworkError = !axiosError.response;
      const isServerError = axiosError.response && axiosError.response.status >= 500;

      if (isNetworkError || isServerError) {
        console.warn(`API call to ${endpoint} failed: ${axiosError.message}`);
        
        // Log detailed error information for debugging
        console.error('API Error Details:', {
          endpoint,
          method,
          isNetworkError,
          isServerError,
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          message: axiosError.message
        });
      }
      
      if (showErrorToast) {
        let errorMessage = 'An error occurred while processing your request';
        let errorDescription = axiosError.message;
        
        if (axiosError.response) {
          if (axiosError.response.status === 429) {
            errorMessage = 'Too many requests';
            errorDescription = 'Please try again later';
          } else if (axiosError.response.status === 403) {
            errorMessage = 'Authentication error';
            errorDescription = 'Please check your API key';
          } else if (axiosError.response.status >= 500 && !(isNetworkError || isServerError)) { // Avoid double server error message if already handled by fallback attempt
            errorMessage = 'Server error';
            errorDescription = 'The server encountered an error';
          }
        } else if (axiosError.request && !(isNetworkError || isServerError)) { // Avoid double network error message
          errorMessage = 'Network error';
          errorDescription = 'Could not connect to the server';
        }
        
        toast.error(errorMessage, {
          description: errorDescription,
          duration: 5000
        });
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiClient, showSuccessToast, showErrorToast]); // Removed setData and setError from dependencies as they are from useState

  const get = useCallback(<T = ResponseType>(endpoint: string, config?: AxiosRequestConfig) => 
    request<T>('GET', endpoint, undefined, config), [request]);
    
  const post = useCallback(<T = ResponseType>(endpoint: string, data: any, config?: AxiosRequestConfig) => 
    request<T>('POST', endpoint, data, config), [request]);
    
  const put = useCallback(<T = ResponseType>(endpoint: string, data: any, config?: AxiosRequestConfig) => 
    request<T>('PUT', endpoint, data, config), [request]);
    
  const del = useCallback(<T = ResponseType>(endpoint: string, config?: AxiosRequestConfig) => 
    request<T>('DELETE', endpoint, undefined, config), [request]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    data,
    get,
    post,
    put,
    delete: del,
    reset
  };
}
