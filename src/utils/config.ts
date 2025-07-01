
import toast from "react-hot-toast";

const MONGO_URI_KEY = 'mongodb_uri';

/**
 * Get MongoDB URI from local storage
 */
export const getMongoUri = (): string => {
  // Try to get from environment variables first
  const envUri = import.meta.env.VITE_MONGODB_URI;
  
  if (envUri && envUri.startsWith('mongodb')) {
    return envUri;
  }
  
  // Fall back to localStorage
  return localStorage.getItem(MONGO_URI_KEY) || '';
};

/**
 * Check if MongoDB is configured
 */
export const isConfigured = (): boolean => {
  const uri = getMongoUri();
  return Boolean(uri && uri.startsWith('mongodb'));
};

/**
 * Save MongoDB configuration
 */
export const saveMongoConfig = async (uri: string): Promise<void> => {
  if (!uri.startsWith('mongodb')) {
    throw new Error('Invalid MongoDB connection string');
  }
  
  // Validate connection (in a real application)
  // Here we just simulate validation
  await new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      if (uri.includes('invalid')) {
        reject(new Error('Could not connect to MongoDB'));
      } else {
        localStorage.setItem(MONGO_URI_KEY, uri);
        resolve();
      }
    }, 500);
  });
};

/**
 * Clear MongoDB configuration
 */
export const clearMongoConfig = (): void => {
  localStorage.removeItem(MONGO_URI_KEY);
};
