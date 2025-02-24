import { useEffect, useRef, useState } from "react";

/**
 * Hook that ensures a loading state persists for a minimum duration.
 * Useful for preventing UI flicker when loading states are too brief.
 */
export function useMinimumLoadingTime(args: {
  isLoading: boolean;
  minimumTime: number;
}) {
  const { isLoading, minimumTime } = args;
  // Track when loading started without causing re-renders
  const loadStartTimeRef = useRef<number | null>(null);
  // Track whether we've met the minimum loading time requirement
  const [isMinLoadingComplete, setIsMinLoadingComplete] = useState(!isLoading);

  useEffect(() => {
    if (isLoading) {
      // When loading starts, record the start time and reset completion state
      loadStartTimeRef.current = Date.now();
      setIsMinLoadingComplete(false);
    } else if (loadStartTimeRef.current) {
      // When loading ends, calculate how much more time we need to wait
      const elapsedTime = Date.now() - loadStartTimeRef.current;
      const remainingTime = Math.max(0, minimumTime - elapsedTime);

      // Wait for the remaining time before marking loading as complete
      const timer = setTimeout(() => {
        setIsMinLoadingComplete(true);
        loadStartTimeRef.current = null;
      }, remainingTime);

      return () => clearTimeout(timer);
    }
  }, [isLoading, minimumTime]);

  // Return true if either:
  // 1. The original loading state is still active, or
  // 2. We haven't met the minimum loading time requirement
  return isLoading || !isMinLoadingComplete;
}
