import { UseQueryOptions } from "@tanstack/react-query"

export const DEFAULT_GC_TIME = 1000 * 60 * 60 * 24 // 24 hours

export const DEFAULT_STALE_TIME = 1000 * 60 * 60 // 1 hour

export const cacheOnlyQueryOptions: Partial<UseQueryOptions<any>> = {
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  staleTime: Infinity,
}
