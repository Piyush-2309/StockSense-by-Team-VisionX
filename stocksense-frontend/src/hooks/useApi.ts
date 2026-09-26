import { useState, useCallback } from 'react';
import { parseApiError } from '../api/client';
import { useToast } from '../context/ToastContext';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  successMessage?: string;
}

export function useApi<TArgs extends any[], TResult>(
  apiFunc: (...args: TArgs) => Promise<{ data: TResult }>,
  options: UseApiOptions = {}
) {
  const [data, setData] = useState<TResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { error: toastError, success: toastSuccess } = useToast();

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | undefined> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiFunc(...args);
        setData(response.data);
        if (options.successMessage) {
          toastSuccess('Success', options.successMessage);
        }
        if (options.onSuccess) {
          options.onSuccess(response.data);
        }
        return response.data;
      } catch (err) {
        const parsedError = parseApiError(err);
        setError(parsedError);
        toastError('Error', parsedError);
        if (options.onError) {
          options.onError(parsedError);
        }
        return undefined;
      } finally {
        setIsLoading(false);
      }
    },
    [apiFunc, options, toastError, toastSuccess]
  );

  return { execute, data, isLoading, error, setError };
}
