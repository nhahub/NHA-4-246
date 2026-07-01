import { useState, useCallback } from 'react';

type AsyncStatus = 'idle' | 'loading' | 'success' | 'error' | 'offline';

interface ApiCallState<T> {
  status: AsyncStatus;
  data: T | null;
  error: string | null;
}

/**
 * useApiCall — standardized async state hook.
 * Wraps any async function and normalizes loading/error/offline/success states.
 * Used throughout the app to ensure consistent error handling.
 */
export function useApiCall<T>() {
  const [state, setState] = useState<ApiCallState<T>>({
    status: 'idle',
    data: null,
    error: null,
  });

  const execute = useCallback(async (fn: () => Promise<T>): Promise<T | null> => {
    setState({ status: 'loading', data: null, error: null });
    try {
      const result = await fn();
      setState({ status: 'success', data: result, error: null });
      return result;
    } catch (err: unknown) {
      if (!navigator.onLine) {
        setState({ status: 'offline', data: null, error: "You're offline. Please check your connection." });
      } else {
        const message =
          err instanceof Error ? err.message : 'Service currently busy. Please try again.';
        setState({ status: 'error', data: null, error: message });
      }
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle', data: null, error: null });
  }, []);

  return { ...state, execute, reset };
}
