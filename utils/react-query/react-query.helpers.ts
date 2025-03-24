import { QueryOptions, UseQueryOptions } from "@tanstack/react-query"
import { queryLogger } from "@/utils/logger"
import { reactQueryClient } from "./react-query.client"

/**
 * Collection of helper functions with clear, explicit names
 * that wrap React Query's operations with more predictable behavior
 */

/**
 * Always forces a network request regardless of cache state
 */
export async function forceNetworkFetchQuery<T>(args: QueryOptions<T>): Promise<T> {
  const { queryKey } = args

  if (!queryKey) {
    throw new Error("queryKey is required")
  }

  return reactQueryClient.fetchQuery({
    ...args,
    queryKey,
    staleTime: 0, // Consider everything stale
  })
}

/**
 * Only fetches if data is stale (respects staleTime in options)
 * Returns cached data if fresh
 */
export async function fetchOnlyIfStaleQuery<T>(args: QueryOptions<T>): Promise<T> {
  const { queryKey } = args

  if (!queryKey) {
    throw new Error("queryKey is required")
  }

  return reactQueryClient.fetchQuery({
    ...args,
    queryKey,
  }) // fetchQuery respects staleTime
}

/**
 * Only fetches if data doesn't exist in cache
 * Never fetches if data exists (even if stale)
 */
export async function fetchOnlyIfMissingQuery<T>(args: QueryOptions<T>): Promise<T> {
  const { queryKey } = args

  if (!queryKey) {
    throw new Error("queryKey is required")
  }

  // Set revalidateIfStale: false to match current behavior
  return reactQueryClient.ensureQueryData({
    ...args,
    queryKey,
    revalidateIfStale: false,
  })
}

/**
 * If fetching is already in progress, wait for that result
 * Otherwise fetch only if stale
 */
export async function fetchWithoutDuplicatesQuery<T>(args: QueryOptions<T>): Promise<T> {
  const { queryKey } = args

  if (!queryKey) {
    throw new Error("queryKey is required")
  }

  const queryState = reactQueryClient.getQueryState(queryKey)

  // If already fetching, don't start another fetch
  if (queryState?.fetchStatus === "fetching") {
    return Promise.resolve(queryState.data as T)
  }

  // Otherwise fetch if stale
  return reactQueryClient.fetchQuery({
    ...args,
    queryKey,
  })
}

/**
 * Prefetches a query if it's enabled
 */
export function prefetchReactQueryBetter<T>(args: UseQueryOptions<T>) {
  if (!args.enabled) {
    queryLogger.debug(`Skipping prefetch for ${args.queryKey} because it's disabled`)
    return
  }
  return reactQueryClient.prefetchQuery(args)
}

/**
 * Refetches a query if it's enabled
 */
export function refetchReactQueryBetter<T>(args: UseQueryOptions<T>) {
  if (!args.enabled) {
    queryLogger.debug(`Skipping refetch for ${args.queryKey} because it's disabled`)
    return Promise.resolve()
  }
  return reactQueryClient.refetchQueries(args)
}
