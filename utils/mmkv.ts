import AsyncStorage from "@react-native-async-storage/async-storage";
import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

export default storage;

export const saveLastXMTPSyncedAt = (timestamp: number) => {
  AsyncStorage.setItem("lastXMTPSyncedAt", `${timestamp}`);
  return storage.set("lastXMTPSyncedAt", timestamp);
};

export const getLastXMTPSyncedAt = () =>
  storage.getNumber("lastXMTPSyncedAt") || 0;
