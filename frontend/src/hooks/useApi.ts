import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiRequestError } from '../services/apiClient';

/**
 * Generic async data-fetching hook.
 * Returns { data, loading, error, refetch }.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): { data: T | null; loading: boolean; error: string | null; errorCode: string | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const generation = useRef(0);

  const load = useCallback(async () => {
    const gen = ++generation.current;
    setLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const result = await fetcher();
      if (gen === generation.current) {
        setData(result);
      }
    } catch (err) {
      if (gen === generation.current) {
        if (err instanceof ApiRequestError) {
          setError(err.message);
          setErrorCode(err.code);
        } else {
          setError('Unable to connect to StockSense server.');
          setErrorCode('NETWORK_ERROR');
        }
      }
    } finally {
      if (gen === generation.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, errorCode, refetch: load };
}

/**
 * Trigger-based mutation hook.
 * Returns { mutate, loading, error }.
 */
export function useMutation<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
): {
  mutate: (...args: TArgs) => Promise<TResult>;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const mutate = useCallback(async (...args: TArgs) => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const result = await fn(...args);
      return result;
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        setErrorCode(err.code);
      } else {
        setError('Unable to connect to StockSense server.');
        setErrorCode('NETWORK_ERROR');
      }
      throw err;
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { mutate, loading, error, errorCode };
}
