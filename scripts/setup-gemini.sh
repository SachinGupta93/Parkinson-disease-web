#!/bin/bash

echo
echo "==================================="
echo "Gemini AI Integration Setup"
echo "==================================="
echo

ENV_FILE=".env"
API_KEY_VAR="VITE_GEMINI_API_KEY"
MODEL_VAR="VITE_GEMINI_MODEL"

echo "This script will help you set up the Gemini AI integration."
echo "You'll need a Gemini API key from Google AI Studio."
echo
echo "If you don't have one yet, visit:"
echo "https://aistudio.google.com/app/apikey"
echo

read -p "Enter your Gemini API key: " API_KEY

if [ -z "$API_KEY" ]; then
    echo "No API key provided. Setup canceled."
    exit 1
fi

echo
echo "Available Gemini models:"
echo "1. gemini-1.5-flash (fastest, recommended)"
echo "2. gemini-1.0-pro (stable)"
echo "3. gemini-1.5-pro (most capable)"
echo

read -p "Select a model (1-3) or press Enter for default (gemini-1.5-flash): " MODEL_CHOICE

MODEL_NAME="gemini-1.5-flash"
if [ "$MODEL_CHOICE" = "2" ]; then
    MODEL_NAME="gemini-1.0-pro"
elif [ "$MODEL_CHOICE" = "3" ]; then
    MODEL_NAME="gemini-1.5-pro"
fi

echo
echo "Creating/updating .env file with your settings..."

if [ -f "$ENV_FILE" ]; then
    echo "Updating existing .env file..."
    
    # Create a temporary file without the API key and model lines
    grep -v "^$API_KEY_VAR=" "$ENV_FILE" | grep -v "^$MODEL_VAR=" > "$ENV_FILE.tmp"
    
    # Add the new API key and model
    echo "$API_KEY_VAR=$API_KEY" >> "$ENV_FILE.tmp"
    echo "$MODEL_VAR=$MODEL_NAME" >> "$ENV_FILE.tmp"
    
    # Replace the original file
    mv "$ENV_FILE.tmp" "$ENV_FILE"
else
    echo "Creating new .env file..."
    echo "$API_KEY_VAR=$API_KEY" > "$ENV_FILE"
    echo "$MODEL_VAR=$MODEL_NAME" >> "$ENV_FILE"
fi

echo
echo "✅ Setup complete!"
echo
echo "Your Gemini API key and model preference have been saved."
echo
echo "Testing the connection..."
echo

node scripts/test-gemini-connection.js

echo
echo "If the test was successful, you're all set!"
echo "If not, please check the error messages above and try again."
echo