import { StateStorage } from "zustand/middleware";
import { storage } from "./storage";

// Storage implementation for Zustand state management

export const zustandMMKVStorage: StateStorage = {
  setItem(name, value) {
    // Deleting before setting to avoid memory leak
    // https://github.com/mrousavy/react-native-mmkv/issues/440
    storage.delete(name);
    return storage.set(name, value);
  },
  getItem: (name) => storage.getString(name) ?? null,
  removeItem: (name) => storage.delete(name),
};
