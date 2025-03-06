import { useFocusEffect } from "@react-navigation/native"
import { QueryKey } from "@tanstack/react-query"
import { useCallback, useRef } from "react"
import { captureError } from "@/utils/capture-error"
import { reactQueryClient } from "@/utils/react-query/react-query-client"

export const useRefetchQueryOnRefocus = (queryKey: string | string[] | QueryKey) => {
  // Skip first focus effect when component mounts
  const firstTimeRef = useRef(true)

  useFocusEffect(
    useCallback(() => {
      if (firstTimeRef.current) {
        firstTimeRef.current = false
        return
      }

      reactQueryClient.invalidateQueries({ queryKey }).catch(captureError)
    }, [queryKey]),
  )
}
