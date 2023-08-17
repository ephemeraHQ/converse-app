import AsyncStorage from "@react-native-async-storage/async-storage";
import { MMKV } from "react-native-mmkv";
import { StateStorage } from "zustand/middleware";

import { useChatStore } from "../data/store/accountsStore";

const storage = new MMKV();

export default storage;

export const zustandMMKVStorage: StateStorage = {
  setItem: (name, value) => {
    return storage.set(name, value);
  },
  getItem: (name) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem: (name) => {
    return storage.delete(name);
  },
};

export const migrateMMKVDataIfNeeded = () => {
  const previousSyncedAt = storage.getNumber("lastXMTPSyncedAt") || 0;
  if (previousSyncedAt) {
    console.log("Migrating `lastXMTPSyncedAt` to zustand storage");
    useChatStore.getState().setLastSyncedAt(previousSyncedAt);
    storage.delete("lastXMTPSyncedAt");
  }
};
