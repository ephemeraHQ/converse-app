import {
  PersistedClient as ReactQueryPersistedClient,
  Persister as ReactQueryPersister,
} from "@tanstack/react-query-persist-client"
import { MMKV } from "react-native-mmkv"
import { captureError } from "@/utils/capture-error"
import { ReactQueryPersistError } from "@/utils/error"
import { persistLogger } from "@/utils/logger"

export const reactQueryMMKV = new MMKV({ id: "convos-react-query-mmkv" })
export const reactQueryPersister = createMMKVPersister(reactQueryMMKV)

const REACT_QUERY_CLIENT_KEY = "react-query-client"

function createMMKVPersister(storage: MMKV): ReactQueryPersister {
  return {
    persistClient: async (client: ReactQueryPersistedClient) => {
      try {
        // Create a deep clone of the client to avoid modifying the original
        const clientToStore = JSON.parse(JSON.stringify(client)) as ReactQueryPersistedClient

        const clientString = JSON.stringify(clientToStore)

        storage.set(REACT_QUERY_CLIENT_KEY, clientString)

        // Debug persisted queries after successful persistence
        if (__DEV__) {
          // Uncomment to debug persisted queries
          // debugPersistedQueries()
        }
      } catch (error) {
        captureError(
          new ReactQueryPersistError({
            error,
            additionalMessage: "Failed to persist React Query client",
            extra: {
              queries: client.clientState.queries.map((q) => q.queryKey.toString()).join(", "),
            },
          }),
        )
      }
    },
    // Automatically called on app load with "PersistQueryClientProvider"
    restoreClient: async () => {
      try {
        const clientString = storage.getString(REACT_QUERY_CLIENT_KEY)

        if (!clientString) {
          return
        }

        return JSON.parse(clientString) as ReactQueryPersistedClient
      } catch (error) {
        captureError(
          new ReactQueryPersistError({
            error,
            additionalMessage: "Failed to restore React Query client",
          }),
        )
      }
    },
    // Automatically called when cache needs to be cleared (max GC, error persistence, etc)
    removeClient: async () => {
      try {
        storage.delete(REACT_QUERY_CLIENT_KEY)
      } catch (error) {
        captureError(
          new ReactQueryPersistError({
            error,
            additionalMessage: "Failed to remove React Query client",
          }),
        )
      }
    },
  }
}

/**
 * Utility function to help debug React Query issues in development
 * This can be called from anywhere to check the current state of the persisted queries
 */
function debugPersistedQueries() {
  if (__DEV__) {
    try {
      const clientString = reactQueryMMKV.getString(REACT_QUERY_CLIENT_KEY)

      if (!clientString) {
        persistLogger.debug("No persisted React Query client found")
        return
      }

      const client = JSON.parse(clientString) as ReactQueryPersistedClient

      const pendingQueries = client.clientState.queries.filter(
        (query) => query.state.status === "pending",
      )

      const fetchingQueries = client.clientState.queries.filter(
        (query) => query.state.fetchStatus === "fetching",
      )

      const pausedQueries = client.clientState.queries.filter(
        (query) => query.state.fetchStatus === "paused",
      )

      persistLogger.debug("Persisted React Query client summary:", {
        totalQueries: client.clientState.queries.length,
        pendingQueries: pendingQueries.length,
        fetchingQueries: fetchingQueries.length,
        pausedQueries: pausedQueries.length,
        queryKeys: client.clientState.queries.map((q) => q.queryKey),
      })

      // Log any potentially problematic queries
      if (pendingQueries.length > 0 || fetchingQueries.length > 0) {
        persistLogger.warn("Found potentially problematic persisted queries:", {
          pendingQueryKeys: pendingQueries.map((q) => q.queryKey),
          fetchingQueryKeys: fetchingQueries.map((q) => q.queryKey),
        })
      }
    } catch (error) {
      captureError(
        new ReactQueryPersistError({
          error,
          additionalMessage: "Error debugging persisted React Query client",
        }),
      )
    }
  }
}
