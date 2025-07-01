import { GoogleGenerativeAI, GenerativeModel, GenerationConfig, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export class GeminiService {
  private apiKey: string;
  private model: GenerativeModel | null = null;
  private availableModels: string[] = ["gemini-pro", "gemini-1.5-pro", "gemini-pro-vision"];
  private rateLimited: boolean = false;
  private rateLimitResetTime: number = 0;
  private rateLimitWaitMs: number = 30000; // 30 seconds default wait time
  
  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('VITE_GEMINI_API_KEY not found in environment variables');
    } else {
      try {
        const genAI = new GoogleGenerativeAI(this.apiKey);
        // Use simpler gemini-pro model which has higher rate limits
        this.model = genAI.getGenerativeModel({
          model: "gemini-pro", // Using standard model with higher rate limits
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 800,
          }
        });
      } catch (error) {
        console.error('Error initializing Gemini service:', error);
        console.warn('Failed to initialize Gemini API client, local responses will be used');
      }
    }
  }

  async generateText(prompt: string, history: { role: string; content: string }[] = []): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    if (!this.model) {
      throw new Error('Gemini model not initialized');
    }
    
    // Check if we're currently rate limited
    if (this.rateLimited) {
      const currentTime = Date.now();
      if (currentTime < this.rateLimitResetTime) {
        const waitTimeRemaining = Math.ceil((this.rateLimitResetTime - currentTime) / 1000);
        throw new Error(`Rate limit in effect. Please try again in ${waitTimeRemaining} seconds.`);
      } else {
        // Reset rate limiting if waiting period is over
        this.rateLimited = false;
      }
    }
    
    try {
      const generationConfig = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 800,
      };
      
      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        }
      ];
      
      // Check if the API key is valid before making the call
      if (!this.apiKey || this.apiKey.trim() === '') {
        throw new Error('No valid API key provided');
      }

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings
      });

      // Handle potential errors or empty responses
      if (!result || !result.response) {
        throw new Error('Empty response from Gemini API');
      }

      // Return the text response
      return result.response.text();
    } catch (error: any) {
      console.error('Error calling Gemini API:', error);
      
      // Handle rate limiting errors
      if (error.message && (
          error.message.includes('429') || 
          error.message.includes('quota') || 
          error.message.includes('rate limit') ||
          error.message.includes('Too Many Requests')
        )) {
        // Set rate limiting
        this.rateLimited = true;
        this.rateLimitResetTime = Date.now() + this.rateLimitWaitMs;
        
        throw new Error(`Rate limit exceeded. API will be available again in ${this.rateLimitWaitMs / 1000} seconds.`);
      }
      
      // Add more specific error handling
      if (error.message && error.message.includes('not found for API version')) {
        throw new Error('The Gemini model version is outdated or unavailable. Please check for API updates.');
      } else if (error.message && error.message.includes('API key')) {
        throw new Error('Invalid or missing Gemini API key. Please check your API key configuration.');
      } else {
        // Rethrow with more context
        throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`);
      }
    }
  }

  async listAvailableModels(): Promise<string[]> {
    if (!this.apiKey) {
      console.warn('No API key configured');
      return [];
    }

    try {
      // Using a hardcoded list because the current version doesn't support listModels
      return this.availableModels;
    } catch (error) {
      console.error('Failed to list models:', error);
      return [];
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('No API key configured');
      return false;
    }

    if (!this.model) {
      console.warn('Model not initialized');
      return false;
    }

    try {
      // Simple test prompt
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
      });
      
      // If we get here without errors, the connection works
      console.log('Gemini API connection successful');
      return true;
    } catch (error: any) {
      console.error('Gemini API connection test failed:', error);
      
      // Check for rate limiting
      if (error.message && (
        error.message.includes('429') || 
        error.message.includes('quota') || 
        error.message.includes('rate limit') ||
        error.message.includes('Too Many Requests')
      )) {
        // Set rate limiting
        this.rateLimited = true;
        this.rateLimitResetTime = Date.now() + this.rateLimitWaitMs;
        console.warn(`Rate limited. API will be available again in ${this.rateLimitWaitMs / 1000} seconds.`);
      }
      
      return false;
    }
  }

  // Check if the service is currently rate limited
  isRateLimited(): boolean {
    if (!this.rateLimited) return false;
    
    const currentTime = Date.now();
    if (currentTime > this.rateLimitResetTime) {
      // Reset rate limiting if waiting period is over
      this.rateLimited = false;
      return false;
    }
    
    return true;
  }

  // Get the time remaining until rate limit is reset
  getRateLimitTimeRemaining(): number {
    if (!this.rateLimited) return 0;
    
    const currentTime = Date.now();
    const timeRemaining = Math.max(0, this.rateLimitResetTime - currentTime);
    return Math.ceil(timeRemaining / 1000); // Return seconds
  }
}

// Export a singleton instance
export const geminiService = new GeminiService();
