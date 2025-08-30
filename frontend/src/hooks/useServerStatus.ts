import { useState, useEffect } from 'react';
import { wakeupServer } from '@/utils/serverWakeup';

type ServerStatus = 'unknown' | 'waking' | 'ready' | 'error';

export function useServerStatus() {
  const [status, setStatus] = useState<ServerStatus>('unknown');
  const [isChecking, setIsChecking] = useState(false);

  const checkServer = async () => {
    setIsChecking(true);
    setStatus('waking');

    const isReady = await wakeupServer({
      timeout: 10000,
      retries: 1,
      onWaking: () => setStatus('waking'),
      onReady: () => setStatus('ready'),
      onError: () => setStatus('error')
    });

    setIsChecking(false);
  };

  useEffect(() => {
    // Only check in production (when VITE_BACKEND_URL is set to a remote URL)
    const backendUrl = import.meta.env['VITE_BACKEND_URL'];
    if (backendUrl && !backendUrl.includes('localhost')) {
      checkServer();
    } else {
      setStatus('ready'); // Assume ready in development
    }
  }, []);

  return {
    status,
    isChecking,
    checkServer,
    isReady: status === 'ready',
    isWaking: status === 'waking',
    hasError: status === 'error'
  };
}