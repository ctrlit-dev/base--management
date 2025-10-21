/**
 * Performance Utilities
 * ====================
 * 
 * Hilfsfunktionen für Performance-Optimierung.
 * Best Practices für React-Performance.
 */

import { useMemo, useCallback, memo } from 'react';

/**
 * Debounce-Funktion für Performance-Optimierung
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle-Funktion für Performance-Optimierung
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Memoized Callback Hook für Performance
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

/**
 * Memoized Value Hook für Performance
 */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

/**
 * HOC für Memoized Components
 */
export function withMemo<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return memo(Component, areEqual);
}

/**
 * Lazy Loading Hook
 */
export function useLazyLoad<T>(
  loadFn: () => Promise<T>,
  deps: React.DependencyList = []
) {
  return useMemo(() => {
    let cancelled = false;
    let result: T | null = null;
    let error: Error | null = null;
    let loading = true;

    loadFn()
      .then((data) => {
        if (!cancelled) {
          result = data;
          loading = false;
        }
      })
      .catch((err) => {
        if (!cancelled) {
          error = err;
          loading = false;
        }
      });

    return () => {
      cancelled = true;
    };
  }, deps);
}

/**
 * Virtual Scrolling Hook für große Listen
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  return useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const totalHeight = items.length * itemHeight;
    
    return {
      visibleCount,
      totalHeight,
      getVisibleItems: (scrollTop: number) => {
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(startIndex + visibleCount, items.length);
        
        return {
          items: items.slice(startIndex, endIndex),
          startIndex,
          endIndex,
          offsetY: startIndex * itemHeight,
        };
      },
    };
  }, [items, itemHeight, containerHeight]);
}

/**
 * Performance Monitoring
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTiming(name: string): () => void {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      const duration = end - start;
      
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      
      this.metrics.get(name)!.push(duration);
      
      // Log slow operations
      if (duration > 100) {
        console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  getMetrics(name: string): { avg: number; min: number; max: number; count: number } | null {
    const times = this.metrics.get(name);
    if (!times || times.length === 0) return null;

    const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    return { avg, min, max, count: times.length };
  }

  getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [name] of this.metrics) {
      const metrics = this.getMetrics(name);
      if (metrics) {
        result[name] = metrics;
      }
    }
    
    return result;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

/**
 * React Performance Hook
 */
export function usePerformanceMonitor(name: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  return useMemoizedCallback(() => {
    return monitor.startTiming(name);
  }, [name]);
}

/**
 * Bundle Size Optimization
 */
export const lazyImport = <T>(
  importFn: () => Promise<T>
): (() => Promise<T>) => {
  let promise: Promise<T> | null = null;
  
  return () => {
    if (!promise) {
      promise = importFn();
    }
    return promise;
  };
};

/**
 * Memory Leak Prevention
 */
export function useCleanup(cleanupFn: () => void) {
  return useMemo(() => {
    return () => {
      cleanupFn();
    };
  }, [cleanupFn]);
}
