import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODELS } from "./geminiConfig";

// Use Vite-style env var for the API key
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY!);

// If a specific model is provided in env, use that instead
const MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL || GEMINI_MODELS[0];

export const getGeminiResponse = async (prompt: string): Promise<string> => {
  try {
    // Use the working model if we found one during testing
    const modelToUse = (window as any).__WORKING_GEMINI_MODEL || MODEL_NAME;
    
    const model = genAI.getGenerativeModel({ model: modelToUse });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    
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
          
          return response.text();
        } catch (fallbackError) {
          console.error(`Fallback model ${fallbackModel} failed:`, fallbackError);
        }
      }
    }
    
    return "Error: Failed to get response from Gemini. Please check your API key configuration.";
  }
};

export const testGeminiConnection = async (): Promise<boolean> => {
  // Try the preferred model first
  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent("Hello");
    return result && result.response ? true : false;
  } catch (error) {
    console.error(`Gemini connection test failed with model ${MODEL_NAME}:`, error);
    
    // If we're already using a custom model from env vars, don't try others
    if (import.meta.env.VITE_GEMINI_MODEL) {
      return false;
    }
    
    // Try fallback models if the first one fails
    for (const fallbackModel of GEMINI_MODELS.slice(1)) {
      try {
        console.log(`Trying fallback model: ${fallbackModel}`);
        const model = genAI.getGenerativeModel({ model: fallbackModel });
        const result = await model.generateContent("Hello");
        if (result && result.response) {
          console.log(`Successfully connected using fallback model: ${fallbackModel}`);
          // Store the working model for future use
          (window as any).__WORKING_GEMINI_MODEL = fallbackModel;
          return true;
        }
      } catch (fallbackError) {
        console.error(`Fallback model ${fallbackModel} failed:`, fallbackError);
      }
    }
    
    return false;
  }
};
