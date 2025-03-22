import { StateStorage } from "zustand/middleware"
import { storage } from "@/utils/storage/storage"

/**
 * Zustand storage adapter for MMKV
 */

export const zustandMMKVStorage: StateStorage = {
  setItem(name, value) {
    // Deleting before setting to avoid memory leak
    // https://github.com/mrousavy/react-native-mmkv/issues/440
    storage.delete(name)
    return storage.set(name, value)
  },
  getItem(name) {
    const value = storage.getString(name)
    return value ?? null
  },
  removeItem(name) {
    return storage.delete(name)
  },
}
