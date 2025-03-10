import { useFocusEffect } from "@react-navigation/native"
import { QueryKey } from "@tanstack/react-query"
import { useCallback, useMemo, useRef } from "react"
import { captureError } from "@/utils/capture-error"
import { reactQueryClient } from "@/utils/react-query/react-query.client"

export const useRefetchQueryOnRefocus = (queryKey: string | string[] | QueryKey | undefined) => {
  // Skip first focus effect when component mounts to avoid unnecessary refetch
  const firstTimeRef = useRef(true)

  const stringifiedKey = queryKey ? JSON.stringify(queryKey) : undefined

  const memoizedQueryKey = useMemo(() => {
    firstTimeRef.current = false
    return stringifiedKey
  }, [stringifiedKey])

  useFocusEffect(
    useCallback(() => {
      if (firstTimeRef.current) {
        firstTimeRef.current = false
        return
      }

      if (!memoizedQueryKey) {
        return
      }

      reactQueryClient.invalidateQueries({ queryKey: memoizedQueryKey }).catch(captureError)
    }, [memoizedQueryKey]),
  )
}
