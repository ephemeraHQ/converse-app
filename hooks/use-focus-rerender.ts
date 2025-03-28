import { useCallback, useState } from "react"
import { useBetterFocusEffect } from "@/hooks/use-better-focus-effect"

/**
 * Hook that triggers a re-render when screen comes into focus
 */
export function useFocusRerender() {
  const [focusCount, setFocusCount] = useState(0)

  useBetterFocusEffect(
    useCallback(() => {
      // Increment counter to trigger re-render
      setFocusCount((prev) => prev + 1)
    }, []),
  )

  return focusCount
}
