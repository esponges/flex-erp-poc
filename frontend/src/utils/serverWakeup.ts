// Server wake-up utility to ping the backend when the app loads
// This helps wake up sleeping servers on free hosting tiers

const BACKEND_URL = import.meta.env['VITE_BACKEND_URL'] || 'http://localhost:8080';

interface WakeupOptions {
  timeout?: number;
  retries?: number;
  onWaking?: () => void;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Pings the backend server to wake it up from sleep
 * Returns a promise that resolves when server responds or times out
 */
export const wakeupServer = async ({
  timeout = 30000, // 30 second timeout
  retries = 3,
  onWaking,
  onReady,
  onError
}: WakeupOptions = {}): Promise<boolean> => {
  
  const pingUrl = `${BACKEND_URL}/health`;
  
  const ping = async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(pingUrl, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        onReady?.();
        return true;
      }
      return false;
    } catch (error) {
      // AbortError means timeout, other errors are actual failures
      if ((error as Error).name !== 'AbortError') {
        console.warn('Server ping failed:', error);
      }
      return false;
    }
  };

  onWaking?.();
  
  // Try multiple times with exponential backoff
  for (let attempt = 1; attempt <= retries; attempt++) {
    console.log(`Pinging server... (attempt ${attempt}/${retries})`);
    
    const success = await ping();
    if (success) {
      console.log('✅ Server is awake and ready!');
      return true;
    }
    
    // Wait before retry (exponential backoff)
    if (attempt < retries) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`Server not ready, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  const error = new Error(`Server failed to respond after ${retries} attempts`);
  onError?.(error);
  console.error('❌ Server wake-up failed:', error.message);
  return false;
};

/**
 * Auto-ping server when the app loads
 * This runs in the background without blocking the UI
 */
export const autoWakeupServer = () => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  // Don't ping localhost (development)
  if (BACKEND_URL.includes('localhost') || BACKEND_URL.includes('127.0.0.1')) {
    console.log('🔧 Development mode - skipping server wakeup');
    return;
  }
  
  console.log('🌅 Attempting to wake up server...');
  
  // Run wakeup in background (non-blocking)
  wakeupServer({
    timeout: 15000, // Shorter timeout for auto-wakeup
    retries: 2,
    onWaking: () => {
      console.log('⏰ Waking up server (this may take up to 60 seconds)...');
    },
    onReady: () => {
      console.log('🚀 Server is ready! API calls should be fast now.');
    },
    onError: (error) => {
      console.warn('⚠️ Server wakeup failed, API calls may be slower:', error.message);
    }
  });
};

/**
 * Show a toast notification about server status
 * This can be used with your existing toast system
 */
export const createServerStatusToast = () => {
  // This could integrate with your toast system
  // For now, we'll use console logs, but you could enhance this
  return {
    showWaking: () => console.log('🌅 Waking up server...'),
    showReady: () => console.log('✅ Server ready!'),
    showError: () => console.log('⚠️ Server may be slow to respond')
  };
};
