// Test your Gemini API connection
// Run this with: node scripts/test-gemini-connection-new.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_KEY = process.env.VITE_GEMINI_API_KEY;

// Models to try in order of preference
const MODEL_NAMES = [
  "gemini-1.5-flash",
  "gemini-1.0-pro",
  "gemini-1.5-pro"
];

// If a specific model is provided in env, use that instead
const PREFERRED_MODEL = process.env.VITE_GEMINI_MODEL || MODEL_NAMES[0];

async function testGeminiConnection() {
  console.log('🧠 Testing Gemini API connection...');
  
  if (!API_KEY) {
    console.error('❌ No API key found. Please create a .env file with VITE_GEMINI_API_KEY');
    console.error('   Run: npm run setup:gemini to set up your API key');
    return;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: PREFERRED_MODEL });
    
    console.log(`🔄 Sending test request to Gemini API using model: ${PREFERRED_MODEL}...`);
    const result = await model.generateContent('Hello, this is a test request. Please respond with "Connection successful".');
    const response = await result.response;
    const text = response.text();
    
    console.log('\n✅ Connection successful!');
    console.log('📝 Response from Gemini:');
    console.log('---------------------------');
    console.log(text);
    console.log('---------------------------');
    console.log('\n✨ Your Gemini API integration is working properly!');
    console.log(`🔧 Using model: ${PREFERRED_MODEL}`);
  } catch (error) {
    console.error('❌ Connection failed with error:');
    console.error(error);
    console.log('\n📋 Troubleshooting steps:');
    console.log('1. Check that your API key is correct');
    console.log('2. Verify your internet connection');
    console.log('3. Check if you have hit any API rate limits');
    console.log('4. Make sure the selected model is available for your API key');
    console.log('5. Visit https://status.generativeai.google to check API status');
    console.log('\nTo reconfigure your setup, run: npm run setup:gemini');
  }
}

testGeminiConnection();