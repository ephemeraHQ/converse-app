import { useEffect, useRef, useState } from "react"

/**
 * Hook that ensures a loading state persists for a minimum duration.
 * Useful for preventing UI flicker when loading states are too brief.
 */
type Args = {
  isLoading: boolean
  // Minimum time that needs to pass before showing loading state
  minTimeBeforeShowing: number
  // Minimum duration to show loading once it's visible
  minimumLoadingDuration: number
}

export function useMinimumLoadingTime(args: Args) {
  const { isLoading, minTimeBeforeShowing, minimumLoadingDuration } = args

  const [shouldShowLoading, setShouldShowLoading] = useState(false)
  const loadStartTimeRef = useRef<number | null>(null)
  const showTimerRef = useRef<NodeJS.Timeout>()
  const hideTimerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    // Clear any existing timers when effect runs
    const clearTimers = () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current)
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
      }
    }

    if (isLoading) {
      clearTimers()

      // Only start timing if we haven't already
      if (!loadStartTimeRef.current) {
        loadStartTimeRef.current = Date.now()
      }

      // Set timer to show loading state after delay
      showTimerRef.current = setTimeout(() => {
        setShouldShowLoading(true)
      }, minTimeBeforeShowing)
    } else {
      // Handle transition to not loading
      if (shouldShowLoading && loadStartTimeRef.current) {
        clearTimers()

        const elapsedTime = Date.now() - loadStartTimeRef.current
        const remainingTime = Math.max(0, minimumLoadingDuration - elapsedTime)

        hideTimerRef.current = setTimeout(() => {
          setShouldShowLoading(false)
          loadStartTimeRef.current = null
        }, remainingTime)
      } else {
        // If we never showed loading, just clean up
        clearTimers()
        loadStartTimeRef.current = null
        setShouldShowLoading(false)
      }
    }

    return clearTimers
  }, [isLoading, minTimeBeforeShowing, minimumLoadingDuration, shouldShowLoading])

  return shouldShowLoading
}
