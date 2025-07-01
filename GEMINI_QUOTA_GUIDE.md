# Gemini API Quota Management

This document explains how the Parkinson's Disease web application handles Google Gemini AI API quota limits.

## Overview

The free tier of Google Gemini API provides **50 requests per day**. To ensure reliable service, our application implements intelligent quota management.

## Features

### 🔧 Automatic Quota Tracking
- Tracks daily request count (max 45/50 to leave buffer)
- Automatically resets counter each day
- Stores quota info in browser localStorage

### ⚠️ Quota Exceeded Handling
- Gracefully falls back to local medical knowledge
- Shows clear user notifications when quota is reached
- Automatically retries after cooldown period

### 📊 User Interface Indicators
- Real-time quota counter in chat header
- Visual indicators when quota is exceeded
- Informative error messages

## User Experience

### When Quota is Available
```
Parkinson's Disease Assistant
12/45 AI requests used today
```

### When Quota is Exceeded
```
Parkinson's Disease Assistant
🕒 AI quota exceeded - using local responses
```

## Fallback System

When Gemini AI is unavailable (quota exceeded, API down, etc.), the system provides:

1. **Local Medical Knowledge**: Pre-programmed responses about Parkinson's disease
2. **Helpful Guidance**: Information about symptoms, treatments, and general advice
3. **Professional Disclaimers**: Clear notices that responses are informational only

## For Developers

### Debug Utilities

The application includes debug utilities available in browser console:

```javascript
// Check current quota status
checkGeminiQuota()

// Reset quota for testing (will refresh page)
resetGeminiQuota()

// Simulate quota exceeded for testing
simulateQuotaExceeded()
```

### Quota Management Functions

```typescript
// Check if requests are within quota limit
checkQuotaLimit(): boolean

// Get current quota information
getGeminiQuotaInfo(): QuotaInfo

// Update quota information
updateQuotaInfo(update: Partial<QuotaInfo>): void
```

### Error Handling

The system handles these scenarios:
- **429 Too Many Requests**: Quota exceeded
- **API Connection Failures**: Network issues
- **Invalid API Keys**: Authentication problems
- **Rate Limiting**: Temporary throttling

## Configuration

### Environment Variables

```bash
VITE_GEMINI_API_KEY=your_api_key_here
VITE_GEMINI_MODEL=gemini-1.5-flash  # Optional: specify model
```

### Quota Limits

```typescript
const MAX_DAILY_REQUESTS = 45; // Conservative limit under 50
```

## User Solutions

### If You Hit Quota Limits

1. **Wait for Reset**: Quota resets at midnight UTC
2. **Use Local Mode**: System still provides helpful medical information
3. **Upgrade API Plan**: Get higher quota limits from Google
4. **Use Multiple API Keys**: Implement key rotation (for developers)

## Best Practices

### For Users
- Use specific, focused questions to get better responses
- Avoid testing the chat unnecessarily to conserve quota
- Local responses are still medically accurate for common questions

### For Developers
- Implement quota tracking before API calls
- Provide clear fallback mechanisms
- Cache responses when appropriate
- Monitor usage patterns

## Troubleshooting

### Common Issues

**"Quota exceeded" error immediately**
- Check if quota was exceeded yesterday and not yet reset
- Use `resetGeminiQuota()` in console for testing

**API connection fails**
- Verify VITE_GEMINI_API_KEY is set correctly
- Check network connectivity
- Verify API key has proper permissions

**Responses seem cached**
- Quota info is cached in localStorage
- Clear browser storage if needed: `localStorage.clear()`

### Getting Help

1. Check browser console for detailed error messages
2. Use debug utilities to inspect quota status
3. Review network tab for API request details
4. Check if API key is valid in Google AI Studio

## Production Considerations

### Scaling Solutions

1. **API Key Rotation**: Use multiple keys with load balancing
2. **Caching**: Store common responses to reduce API calls
3. **User Authentication**: Track quota per user instead of globally
4. **Premium Tier**: Upgrade to paid Google AI plans for higher limits

### Monitoring

- Track daily quota usage patterns
- Monitor fallback usage rates
- Set up alerts for quota threshold breaches
- Log API errors for analysis
