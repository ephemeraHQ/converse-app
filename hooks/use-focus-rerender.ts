import { useFocusEffect } from "@react-navigation/native"
import { useCallback, useState } from "react"

/**
 * Hook that triggers a re-render when screen comes into focus
 * Useful for updating time-based displays
 * @returns number - Increments on each focus, can be used as a dependency
 */
export function useFocusRerender() {
  const [focusCount, setFocusCount] = useState(0)

  useFocusEffect(
    useCallback(() => {
      // Increment counter to trigger re-render
      setFocusCount((prev) => prev + 1)
    }, []),
  )

  return focusCount
}
