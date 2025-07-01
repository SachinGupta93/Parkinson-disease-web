import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODELS } from "./geminiConfig";

// Use Vite-style env var for the API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY!);

// If a specific model is provided in env, use that instead
const MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL || GEMINI_MODELS[0];

// Quota management
interface QuotaInfo {
  dailyRequestCount: number;
  lastResetDate: string;
  isQuotaExceeded: boolean;
  retryAfter?: number;
}

const QUOTA_STORAGE_KEY = 'gemini_quota_info';
const MAX_DAILY_REQUESTS = 45; // Conservative limit under the 50 free tier limit

const getQuotaInfo = (): QuotaInfo => {
  const stored = localStorage.getItem(QUOTA_STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    const today = new Date().toDateString();
    if (parsed.lastResetDate === today) {
      return parsed;
    }
  }
  
  // Reset daily counter
  const newQuota: QuotaInfo = {
    dailyRequestCount: 0,
    lastResetDate: new Date().toDateString(),
    isQuotaExceeded: false
  };
  localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(newQuota));
  return newQuota;
};

const updateQuotaInfo = (update: Partial<QuotaInfo>) => {
  const current = getQuotaInfo();
  const updated = { ...current, ...update };
  localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(updated));
};

const checkQuotaLimit = (): boolean => {
  const quota = getQuotaInfo();
  
  // If we previously hit a 429, check if retry time has passed
  if (quota.isQuotaExceeded && quota.retryAfter) {
    const now = Date.now();
    if (now < quota.retryAfter) {
      return false; // Still in cooldown
    } else {
      // Cooldown period has passed, reset quota exceeded flag
      updateQuotaInfo({ isQuotaExceeded: false, retryAfter: undefined });
    }
  }
  
  return quota.dailyRequestCount < MAX_DAILY_REQUESTS && !quota.isQuotaExceeded;
};

export const getGeminiResponse = async (prompt: string): Promise<string> => {
  // Check quota before making request
  if (!checkQuotaLimit()) {
    const quota = getQuotaInfo();
    if (quota.retryAfter) {
      const waitTime = Math.ceil((quota.retryAfter - Date.now()) / 1000);
      return `🔄 Gemini API quota exceeded. Please wait ${waitTime} seconds and try again. Using local analysis instead.`;
    }
    return "🔄 Daily Gemini API quota reached. Using local analysis instead.";
  }

  try {
    // Use the working model if we found one during testing
    const modelToUse = (window as any).__WORKING_GEMINI_MODEL || MODEL_NAME;
    
    const model = genAI.getGenerativeModel({ model: modelToUse });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Increment successful request counter
    const quota = getQuotaInfo();
    updateQuotaInfo({ dailyRequestCount: quota.dailyRequestCount + 1 });
    
    return response.text();
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Handle 429 quota exceeded error specifically
    if (error?.message?.includes('429') || error?.message?.includes('quota')) {
      console.warn('Gemini API quota exceeded');
      
      // Extract retry delay if available (default to 1 hour)
      let retryAfter = Date.now() + (60 * 60 * 1000); // 1 hour default
      if (error?.message?.includes('retryDelay')) {
        const retryMatch = error.message.match(/retryDelay":"(\d+)s/);
        if (retryMatch) {
          retryAfter = Date.now() + (parseInt(retryMatch[1]) * 1000);
        }
      }
      
      updateQuotaInfo({ 
        isQuotaExceeded: true, 
        retryAfter 
      });
      
      return "🔄 Gemini API quota exceeded. Using local analysis instead. The system will automatically retry later.";
    }
    
    // If this is the first error with the default model, try fallbacks
    if (!(window as any).__TRIED_FALLBACK_MODELS) {
      (window as any).__TRIED_FALLBACK_MODELS = true;
      
      // Try available fallback models
      for (const fallbackModel of GEMINI_MODELS) {
        if (fallbackModel === MODEL_NAME) continue; // Skip the one that just failed
        
        try {
          console.log(`Trying fallback model for response: ${fallbackModel}`);
          const model = genAI.getGenerativeModel({ model: fallbackModel });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          
          // Save the working model for future requests
          (window as any).__WORKING_GEMINI_MODEL = fallbackModel;
          console.log(`Found working model: ${fallbackModel}`);
          
          // Increment successful request counter
          const quota = getQuotaInfo();
          updateQuotaInfo({ dailyRequestCount: quota.dailyRequestCount + 1 });
          
          return response.text();
        } catch (fallbackError) {
          console.error(`Fallback model ${fallbackModel} failed:`, fallbackError);
        }
      }
    }
    
    return "⚠️ Gemini AI temporarily unavailable. Using local analysis instead.";
  }
};

export const testGeminiConnection = async (): Promise<boolean> => {
  // Check quota before testing
  if (!checkQuotaLimit()) {
    console.warn('Gemini API quota limit reached, skipping connection test');
    return false;
  }

  // Try the preferred model first
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent("Hello");
    
    if (result && result.response) {
      // Increment request counter for successful test
      const quota = getQuotaInfo();
      updateQuotaInfo({ dailyRequestCount: quota.dailyRequestCount + 1 });
      return true;
    }
    return false;
  } catch (error: any) {
    console.error(`Gemini connection test failed with model ${MODEL_NAME}:`, error);
    
    // Handle quota exceeded during test
    if (error?.message?.includes('429') || error?.message?.includes('quota')) {
      console.warn('Gemini API quota exceeded during connection test');
      updateQuotaInfo({ isQuotaExceeded: true });
      return false;
    }
    
    // If we're already using a custom model from env vars, don't try others
    if (import.meta.env.VITE_GEMINI_MODEL) {
      return false;
    }
    
    // Try fallback models if the first one fails
    for (const fallbackModel of GEMINI_MODELS.slice(1)) {
      if (!checkQuotaLimit()) {
        console.warn('Quota limit reached while testing fallback models');
        break;
      }
      
      try {
        console.log(`Trying fallback model: ${fallbackModel}`);
        const model = genAI.getGenerativeModel({ model: fallbackModel });
        const result = await model.generateContent("Hello");
        if (result && result.response) {
          console.log(`Successfully connected using fallback model: ${fallbackModel}`);
          // Store the working model for future use
          (window as any).__WORKING_GEMINI_MODEL = fallbackModel;
          
          // Increment request counter
          const quota = getQuotaInfo();
          updateQuotaInfo({ dailyRequestCount: quota.dailyRequestCount + 1 });
          
          return true;
        }
      } catch (fallbackError: any) {
        console.error(`Fallback model ${fallbackModel} failed:`, fallbackError);
        
        // If this fallback also hits quota limit, stop trying
        if (fallbackError?.message?.includes('429') || fallbackError?.message?.includes('quota')) {
          console.warn('Quota exceeded on fallback model, stopping tests');
          updateQuotaInfo({ isQuotaExceeded: true });
          break;
        }
      }
    }
    
    return false;
  }
};

// Export quota info getter for UI components
export const getGeminiQuotaInfo = () => getQuotaInfo();
