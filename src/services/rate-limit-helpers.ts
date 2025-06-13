/**
 * Helper functions for handling rate limiting in the GeminiBot component
 */

/**
 * Starts a countdown timer for rate limiting
 * @param currentTime Current timer value in seconds
 * @param setTimerFn Function to update the timer state
 * @param setIsRateLimitedFn Function to update the rate limiting state
 * @param onComplete Optional callback to execute when timer finishes
 * @returns Interval ID for cleanup
 */
export const startRateLimitTimer = (
  currentTime: number, 
  setTimerFn: (value: React.SetStateAction<number>) => void,
  setIsRateLimitedFn: (value: React.SetStateAction<boolean>) => void,
  onComplete?: () => void
): number => {
  const intervalId = window.setInterval(() => {
    setTimerFn(prevTimer => {
      if (prevTimer <= 1) {
        // Reset rate limit when timer reaches zero
        setIsRateLimitedFn(false);
        window.clearInterval(intervalId);
        
        // Execute callback if provided
        if (onComplete) {
          onComplete();
        }
        return 0;
      }
      return prevTimer - 1;
    });
  }, 1000);
  
  return intervalId;
};
