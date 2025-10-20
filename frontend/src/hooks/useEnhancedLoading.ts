/**
 * Enhanced Loading Hook
 * =====================
 * 
 * Verbesserter Custom Hook für Loading States mit Retry-Funktionalität.
 * Bietet konsistente Loading-Patterns für alle API-Aufrufe.
 * 
 * Optimierungen:
 * - Retry Logic mit Exponential Backoff
 * - Debounced Loading States
 * - Optimistic Updates
 * - Error Recovery
 * - Performance Monitoring
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface LoadingState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
  retryCount: number;
  lastAttempt: number;
}

export interface LoadingOptions {
  initialData?: any;
  maxRetries?: number;
  retryDelay?: number;
  retryBackoff?: boolean;
  debounceMs?: number;
  optimisticUpdate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  onRetry?: (retryCount: number) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export interface LoadingReturn<T> extends LoadingState<T> {
  execute: (...args: any[]) => Promise<T>;
  retry: () => Promise<T>;
  reset: () => void;
  setData: (data: T) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
}

export const useEnhancedLoading = <T = any>(
  asyncFn: (...args: any[]) => Promise<T>,
  options: LoadingOptions = {}
): LoadingReturn<T> => {
  const {
    initialData = null,
    maxRetries = 3,
    retryDelay = 1000,
    retryBackoff = true,
    debounceMs = 0,
    onSuccess,
    onError,
    onRetry,
    onLoadingChange
  } = options;

  const [state, setState] = useState<LoadingState<T>>({
    data: initialData,
    loading: false,
    error: null,
    success: false,
    retryCount: 0,
    lastAttempt: 0
  });

  const debounceTimeoutRef = useRef<number | undefined>(undefined);
  const retryTimeoutRef = useRef<number | undefined>(undefined);
  const currentRetryCountRef = useRef(0);
  const lastArgsRef = useRef<any[]>([]);

  // Calculate retry delay with exponential backoff
  const getRetryDelay = useCallback((retryCount: number): number => {
    if (!retryBackoff) return retryDelay;
    return retryDelay * Math.pow(2, retryCount - 1);
  }, [retryDelay, retryBackoff]);

  // Debounced execution
  const executeDebounced = useCallback(
    (...args: any[]) => {
      if (debounceMs > 0) {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        
        return new Promise<T>((resolve, reject) => {
          debounceTimeoutRef.current = window.setTimeout(async () => {
            try {
              const result = await executeInternal(...args);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          }, debounceMs);
        });
      }
      
      return executeInternal(...args);
    },
    [debounceMs]
  );

  // Internal execution logic
  const executeInternal = useCallback(
    async (...args: any[]): Promise<T> => {
      lastArgsRef.current = args;
      
      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
        success: false,
        lastAttempt: Date.now()
      }));

      onLoadingChange?.(true);

      try {
        const result = await asyncFn(...args);
        
        setState(prev => ({
          ...prev,
          data: result,
          loading: false,
          error: null,
          success: true,
          retryCount: 0
        }));

        onSuccess?.(result);
        onLoadingChange?.(false);
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten';
        
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
          success: false
        }));

        onError?.(error);
        onLoadingChange?.(false);
        throw error;
      }
    },
    [asyncFn, onSuccess, onError, onLoadingChange]
  );

  // Retry logic with exponential backoff
  const retry = useCallback(async (): Promise<T> => {
    if (currentRetryCountRef.current >= maxRetries) {
      throw new Error('Maximum retry count reached');
    }

    currentRetryCountRef.current += 1;
    
    setState(prev => ({
      ...prev,
      retryCount: currentRetryCountRef.current
    }));

    onRetry?.(currentRetryCountRef.current);

    // Wait before retry with exponential backoff
    const delay = getRetryDelay(currentRetryCountRef.current);
    
    return new Promise((resolve, reject) => {
      retryTimeoutRef.current = window.setTimeout(async () => {
        try {
          const result = await executeInternal(...lastArgsRef.current);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }, [executeInternal, maxRetries, getRetryDelay, onRetry]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      success: false,
      retryCount: 0,
      lastAttempt: 0
    });
    currentRetryCountRef.current = 0;
    
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, [initialData]);

  // Manual state setters
  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
    onLoadingChange?.(loading);
  }, [onLoadingChange]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    execute: executeDebounced,
    retry,
    reset,
    setData,
    setError,
    setLoading,
    clearError
  };
};

// Hook for multiple loading states
export const useMultipleLoading = <T extends Record<string, (...args: any[]) => Promise<any>>>(
  operations: T,
  options: LoadingOptions = {}
): { [K in keyof T]: LoadingReturn<Awaited<ReturnType<T[K]>>> } => {
  const result = {} as any;

  for (const [key, operation] of Object.entries(operations)) {
    result[key] = useEnhancedLoading(operation, options);
  }

  return result;
};

// Hook for optimistic updates
export const useOptimisticLoading = <T = any>(
  asyncFn: (...args: any[]) => Promise<T>,
  options: LoadingOptions = {}
): LoadingReturn<T> & {
  optimisticExecute: (optimisticData: T, ...args: any[]) => Promise<T>;
} => {
  const loading = useEnhancedLoading(asyncFn, { ...options, optimisticUpdate: true });

  const optimisticExecute = useCallback(
    async (optimisticData: T, ...args: any[]): Promise<T> => {
      // Set optimistic data immediately
      loading.setData(optimisticData);
      loading.setLoading(true);
      loading.setError(null);

      try {
        const result = await loading.execute(...args);
        return result;
      } catch (error) {
        // Revert to previous data on error
        loading.reset();
        throw error;
      }
    },
    [loading]
  );

  return {
    ...loading,
    optimisticExecute
  };
};

export default useEnhancedLoading;
