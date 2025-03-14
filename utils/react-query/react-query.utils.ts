import AsyncStorage from "@react-native-async-storage/async-storage"
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister"
import {
  PersistedClient as ReactQueryPersistedClient,
  Persister as ReactQueryPersister,
} from "@tanstack/react-query-persist-client"
import { MMKV } from "react-native-mmkv"
import { config } from "@/config"
import { captureError } from "@/utils/capture-error"
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
        const clientString = JSON.stringify(client)
        storage.set("reactQuery", clientString)
      } catch (error) {
        captureError(error, {
          extras: {
            type: "reactQueryPersister",
            storage: storage.toString(),
          },
        })
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
        logger.error("Failed to restore React Query client", error)
        return undefined
      }
    },
    removeClient: async () => {
      try {
        storage.delete("reactQuery")
      } catch (error) {
        logger.error("Failed to remove React Query client", error)
      }
    },
  }
}

export const reactQueryPersister = createMMKVPersister(reactQueryMMKV)
export const secureQueryPersister = createMMKVPersister(secureQueryMMKV)
