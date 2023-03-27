import { MMKV } from "react-native-mmkv";

const storage = new MMKV();

export default storage;

export const saveLastXMTPSyncedAt = (timestamp: number) =>
  storage.set("lastXMTPSyncedAt", timestamp);

export const getLastXMTPSyncedAt = () =>
  storage.getNumber("lastXMTPSyncedAt") || 0;
