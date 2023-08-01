import AsyncStorage from "@react-native-async-storage/async-storage";
import { MMKV } from "react-native-mmkv";
import { StateStorage } from "zustand/middleware";

const storage = new MMKV();

export default storage;

export const saveLastXMTPSyncedAt = (timestamp: number) => {
  AsyncStorage.setItem("lastXMTPSyncedAt", `${timestamp}`);
  return storage.set("lastXMTPSyncedAt", timestamp);
};

export const getLastXMTPSyncedAt = () =>
  storage.getNumber("lastXMTPSyncedAt") || 0;

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
