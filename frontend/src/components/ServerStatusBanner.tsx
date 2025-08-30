import { useServerStatus } from '@/hooks/useServerStatus';

export function ServerStatusBanner() {
  const { status, isWaking, hasError, checkServer } = useServerStatus();

  // Don't show anything if server is ready or unknown
  if (status === 'ready' || status === 'unknown') {
    return null;
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-sm text-center ${
      isWaking 
        ? 'bg-blue-600 text-white' 
        : 'bg-amber-600 text-white'
    }`}>
      {isWaking ? (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          <span>Waking up server... This may take up to 60 seconds.</span>
        </div>
      ) : hasError ? (
        <div className="flex items-center justify-center gap-4">
          <span>Server is taking longer than expected to respond.</span>
          <button 
            onClick={checkServer}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-medium"
          >
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}