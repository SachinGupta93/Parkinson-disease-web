/**
 * Debug utility for managing Gemini API quota
 * This can be used in browser console to reset quota limits for testing
 */

// Function to reset daily quota (for testing)
export const resetGeminiQuota = () => {
  const resetQuota = {
    dailyRequestCount: 0,
    lastResetDate: new Date().toDateString(),
    isQuotaExceeded: false
  };
  localStorage.setItem('gemini_quota_info', JSON.stringify(resetQuota));
  console.log('✅ Gemini quota reset successfully');
  
  // Refresh the page to update UI
  window.location.reload();
};

// Function to check current quota status
export const checkGeminiQuota = () => {
  const stored = localStorage.getItem('gemini_quota_info');
  if (stored) {
    const quota = JSON.parse(stored);
    console.log('📊 Current Gemini Quota Status:');
    console.log(`   Daily requests: ${quota.dailyRequestCount}/45`);
    console.log(`   Quota exceeded: ${quota.isQuotaExceeded ? 'Yes' : 'No'}`);
    console.log(`   Last reset: ${quota.lastResetDate}`);
    if (quota.retryAfter) {
      const waitTime = Math.ceil((quota.retryAfter - Date.now()) / 1000);
      console.log(`   Retry in: ${waitTime > 0 ? waitTime + ' seconds' : 'Now available'}`);
    }
    return quota;
  } else {
    console.log('ℹ️ No quota information found');
    return null;
  }
};

// Function to simulate quota exceeded (for testing)
export const simulateQuotaExceeded = () => {
  const quota = {
    dailyRequestCount: 50,
    lastResetDate: new Date().toDateString(),
    isQuotaExceeded: true,
    retryAfter: Date.now() + (60 * 60 * 1000) // 1 hour from now
  };
  localStorage.setItem('gemini_quota_info', JSON.stringify(quota));
  console.log('⚠️ Simulated quota exceeded state');
  window.location.reload();
};

// Make functions available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).resetGeminiQuota = resetGeminiQuota;
  (window as any).checkGeminiQuota = checkGeminiQuota;
  (window as any).simulateQuotaExceeded = simulateQuotaExceeded;
  
  console.log(`
🔧 Gemini Debug Utilities Available:
   - resetGeminiQuota() - Reset daily quota counter
   - checkGeminiQuota() - Check current quota status  
   - simulateQuotaExceeded() - Simulate quota exceeded for testing

Type any of these functions in the browser console to use them.
  `);
}
