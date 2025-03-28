import { useFocusEffect } from "@react-navigation/native"
import { useCallback, useRef } from "react"

export function useBetterFocusEffect(fn: () => void) {
  const hasRunRef = useRef(false)

  useFocusEffect(
    useCallback(() => {
      // Skip if we've already run this effect once
      if (hasRunRef.current) {
        return
      }

      hasRunRef.current = true
      fn()

      // No cleanup needed - useFocusEffect handles blur/focus automatically
    }, [fn]),
  )
}
