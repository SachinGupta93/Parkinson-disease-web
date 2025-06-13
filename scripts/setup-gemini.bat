@echo off
echo.
echo ===================================
echo Gemini AI Integration Setup
echo ===================================
echo.

set ENV_FILE=.env
set API_KEY_VAR=VITE_GEMINI_API_KEY
set MODEL_VAR=VITE_GEMINI_MODEL

echo This script will help you set up the Gemini AI integration.
echo You'll need a Gemini API key from Google AI Studio.
echo.
echo If you don't have one yet, visit:
echo https://aistudio.google.com/app/apikey
echo.

set /p API_KEY="Enter your Gemini API key: "

if "%API_KEY%"=="" (
    echo No API key provided. Setup canceled.
    exit /b 1
)

echo.
echo Available Gemini models:
echo 1. gemini-1.5-flash (fastest, recommended)
echo 2. gemini-1.0-pro (stable)
echo 3. gemini-1.5-pro (most capable)
echo.

set /p MODEL_CHOICE="Select a model (1-3) or press Enter for default (gemini-1.5-flash): "

set MODEL_NAME=gemini-1.5-flash
if "%MODEL_CHOICE%"=="2" set MODEL_NAME=gemini-1.0-pro
if "%MODEL_CHOICE%"=="3" set MODEL_NAME=gemini-1.5-pro

echo.
echo Creating/updating .env file with your settings...

if exist %ENV_FILE% (
    echo Updating existing .env file...
    
    findstr /v "%API_KEY_VAR%=" %ENV_FILE% > %ENV_FILE%.tmp
    echo %API_KEY_VAR%=%API_KEY%>> %ENV_FILE%.tmp
    
    findstr /v "%MODEL_VAR%=" %ENV_FILE%.tmp > %ENV_FILE%.tmp2
    echo %MODEL_VAR%=%MODEL_NAME%>> %ENV_FILE%.tmp2
    
    move /y %ENV_FILE%.tmp2 %ENV_FILE% > nul
    del %ENV_FILE%.tmp 2>nul
) else (
    echo Creating new .env file...
    echo %API_KEY_VAR%=%API_KEY%> %ENV_FILE%
    echo %MODEL_VAR%=%MODEL_NAME%>> %ENV_FILE%
)

echo.
echo ✅ Setup complete!
echo.
echo Your Gemini API key and model preference have been saved.
echo.
echo Testing the connection...
echo.

node scripts/test-gemini-connection.js

echo.
echo If the test was successful, you're all set!
echo If not, please check the error messages above and try again.
echo.