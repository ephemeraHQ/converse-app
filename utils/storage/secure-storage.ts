import * as SecureStore from "expo-secure-store"
import { config } from "@/config"

export const setSecureItemAsync = (key: string, value: string) =>
  SecureStore.setItemAsync(key, value, secureStoreOptions)

export const getSecureItemAsync = (key: string) => SecureStore.getItemAsync(key, secureStoreOptions)

export const deleteSecureItemAsync = (key: string) =>
  SecureStore.deleteItemAsync(key, secureStoreOptions)

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  // To make sure we don't have conflicts with other apps
  keychainService: config.bundleId,
  // Make sure the data is available after the first unlock
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
}
