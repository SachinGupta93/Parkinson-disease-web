#!/usr/bin/env node

// Simple test for Gemini models availability
// Run with: node scripts/test-gemini-models.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ No API key found in .env file. Please add VITE_GEMINI_API_KEY=your_key_here');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Models to test
const MODELS_TO_TEST = [
  "gemini-1.5-flash", 
  "gemini-1.0-pro",
  "gemini-1.5-pro",
  "gemini-pro" // Legacy model name
];

async function testModels() {
  console.log('🔍 Testing which Gemini models are available with your API key...');
  console.log('-----------------------------------------------------------');
  
  const results = {
    working: [],
    notWorking: []
  };

  // Test each model
  for (const modelName of MODELS_TO_TEST) {
    process.stdout.write(`Testing ${modelName}... `);
    
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = 'Respond with only "OK" if you can see this message.';
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('✅ AVAILABLE');
      results.working.push(modelName);
    } catch (error) {
      console.log('❌ NOT AVAILABLE');
      results.notWorking.push(modelName);
    }
  }

  console.log('\n-----------------------------------------------------------');
  
  if (results.working.length > 0) {
    console.log('✅ Working models:');
    results.working.forEach(model => console.log(`   - ${model}`));
    
    console.log('\n💡 Recommended configuration:');
    console.log(`Add this to your .env file:`);
    console.log(`VITE_GEMINI_MODEL=${results.working[0]}`);
    
    // Write a model.config.js file for easy importing
    const configContent = `// Auto-generated model config - ${new Date().toISOString()}
export const AVAILABLE_MODELS = ${JSON.stringify(results.working, null, 2)};
export const RECOMMENDED_MODEL = "${results.working[0]}";
`;
    
    fs.writeFileSync(path.join(__dirname, '..', 'src', 'utils', 'gemini.config.js'), configContent);
    console.log('\n✅ Created src/utils/gemini.config.js with available models');
  } else {
    console.log('❌ No Gemini models are available with your current API key');
    console.log('Please ensure:');
    console.log('1. Your API key is correct');
    console.log('2. You have access to Gemini models');
    console.log('3. You have not exceeded your quota or rate limits');
  }
}

testModels().catch(err => {
  console.error('Error during testing:', err);
  process.exit(1);
});
