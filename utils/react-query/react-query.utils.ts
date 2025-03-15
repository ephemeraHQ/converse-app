import {
  PersistedClient as ReactQueryPersistedClient,
  Persister as ReactQueryPersister,
} from "@tanstack/react-query-persist-client"
import { MMKV } from "react-native-mmkv"
import { config } from "@/config"
import { captureError } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"
import logger from "@/utils/logger"

// Create MMKV instances for React Query
export const reactQueryMMKV = new MMKV({ id: "convos-react-query" })
export const secureQueryMMKV = new MMKV({
  id: "secure-convos-react-query",
  encryptionKey: config.reactQueryEncryptionKey,
})

/**
 * Creates a persister for React Query using MMKV storage
 */
function createMMKVPersister(storage: MMKV): ReactQueryPersister {
  return {
    persistClient: async (client: ReactQueryPersistedClient) => {
      try {
        // Create a deep clone of the client to avoid modifying the original
        const clientToStore = JSON.parse(JSON.stringify(client)) as ReactQueryPersistedClient

        // Filter out any queries that are in a pending state to avoid errors on rehydration
        if (clientToStore.clientState.queries) {
          // Remove queries in pending state
          clientToStore.clientState.queries = clientToStore.clientState.queries.filter(
            (query) => query.state.status !== "pending",
          )

          // Also ensure that any query with fetchStatus === 'fetching' is not persisted
          // as these can also cause issues on rehydration
          clientToStore.clientState.queries = clientToStore.clientState.queries.filter(
            (query) => query.state.fetchStatus !== "fetching",
          )

          // For queries with fetchMeta, ensure they're properly handled
          clientToStore.clientState.queries.forEach((query) => {
            // Reset fetchStatus to ensure clean rehydration
            if (query.state.fetchStatus === "paused") {
              query.state.fetchStatus = "idle"
            }
          })
        }

        const clientString = JSON.stringify(clientToStore)
        storage.set("reactQuery", clientString)
      } catch (error) {
        captureError(
          new GenericError({
            error,
            additionalMessage: "Failed to persist React Query client",
          }),
          {
            extras: {
              queries: client.clientState.queries.map((q) => q.queryKey.toString).join(", "),
            },
          },
        )
      }
    },
    restoreClient: async () => {
      try {
        const clientString = storage.getString("reactQuery")
        if (!clientString) {
          return undefined
        }
        return JSON.parse(clientString) as ReactQueryPersistedClient
      } catch (error) {
        captureError(
          new GenericError({
            error,
            additionalMessage: "Failed to restore React Query client",
          }),
        )
        return undefined
      }
    },
    removeClient: async () => {
      try {
        storage.delete("reactQuery")
      } catch (error) {
        captureError(
          new GenericError({ error, additionalMessage: "Failed to remove React Query client" }),
        )
      }
    },
  }
}

export const reactQueryPersister = createMMKVPersister(reactQueryMMKV)
export const secureQueryPersister = createMMKVPersister(secureQueryMMKV)

/**
 * Utility function to help debug React Query issues in development
 * This can be called from anywhere to check the current state of the persisted queries
 */
export function debugPersistedQueries() {
  if (__DEV__) {
    try {
      const clientString = reactQueryMMKV.getString("reactQuery")
      if (!clientString) {
        logger.debug("No persisted React Query client found")
        return
      }

      const client = JSON.parse(clientString) as ReactQueryPersistedClient

      // Log summary of persisted queries
      const pendingQueries = client.clientState.queries.filter(
        (query) => query.state.status === "pending",
      )

      const fetchingQueries = client.clientState.queries.filter(
        (query) => query.state.fetchStatus === "fetching",
      )

      const pausedQueries = client.clientState.queries.filter(
        (query) => query.state.fetchStatus === "paused",
      )

      logger.debug("Persisted React Query client summary:", {
        totalQueries: client.clientState.queries.length,
        pendingQueries: pendingQueries.length,
        fetchingQueries: fetchingQueries.length,
        pausedQueries: pausedQueries.length,
        queryKeys: client.clientState.queries.map((q) => q.queryKey),
      })

      // Log any potentially problematic queries
      if (pendingQueries.length > 0 || fetchingQueries.length > 0) {
        logger.warn("Found potentially problematic persisted queries:", {
          pendingQueryKeys: pendingQueries.map((q) => q.queryKey),
          fetchingQueryKeys: fetchingQueries.map((q) => q.queryKey),
        })
      }
    } catch (error) {
      logger.error("Error debugging persisted React Query client", error)
    }
  }
}

// Helper to have a consistent way to format query keys
export function getQueryKey(args: { baseStr: string; [key: string]: string }) {
  const { baseStr, ...rest } = args
  return [baseStr, ...Object.entries(rest).map(([key, value]) => `${key}: ${value}`)]
}
