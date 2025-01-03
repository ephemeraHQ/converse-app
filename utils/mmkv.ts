import { experimental_createPersister } from "@tanstack/react-query-persist-client";
import { parse, stringify } from "flatted";
import { MMKV } from "react-native-mmkv";
import { StateStorage } from "zustand/middleware";

import { getEncryptionKeyByInboxId } from "./keychain/helpers";
import logger from "./logger";
import { GC_TIME } from "@/queries/queryClient.constants";

const storage = new MMKV();

export default storage;

export const zustandMMKVStorage: StateStorage = {
  setItem(name, value) {
    // Deleting before setting to avoid memory leak
    // https://github.com/mrousavy/react-native-mmkv/issues/440
    storage.delete(name);
    return storage.set(name, value);
  },
  getItem(name) {
    const value = storage.getString(name);
    return value ?? null;
  },
  removeItem(name) {
    return storage.delete(name);
  },
};

export const secureMmkvByInboxId: { [inboxId: string]: MMKV } = {};

export const getSecureMmkvForInboxId = async ({
  inboxId,
}: {
  inboxId: string;
}) => {
  if (secureMmkvByInboxId[inboxId]) return secureMmkvByInboxId[inboxId];
  const encryptionKey = await getEncryptionKeyByInboxId({ inboxId });
  const mmkvStringEncryptionKey = encryptionKey.toString("base64").slice(0, 16);

  secureMmkvByInboxId[inboxId] = new MMKV({
    id: `secure-mmkv-${inboxId}`,
    encryptionKey: mmkvStringEncryptionKey,
  });
  return secureMmkvByInboxId[inboxId];
};

export const clearSecureMmkvForInboxId = async ({
  inboxId,
}: {
  inboxId: string;
}) => {
  try {
    const instance = await getSecureMmkvForInboxId({ inboxId });
    instance.clearAll();
  } catch (e) {
    logger.error(e);
  }
  delete secureMmkvByInboxId[inboxId];
};

const reactQueryMMKV = new MMKV({ id: "converse-react-query" });

const reactQuerySyncStorage = {
  getItem: (key: string) => {
    const stringValue = reactQueryMMKV.getString(key);
    return stringValue || null;
  },
  setItem: (key: string, value: string) => {
    // Deleting before setting to avoid memory leak
    // https://github.com/mrousavy/react-native-mmkv/issues/440
    reactQueryMMKV.delete(key);
    if (value) {
      reactQueryMMKV.set(key, value);
    }
  },
  removeItem: (key: string) => reactQueryMMKV.delete(key),
};

export const reactQueryPersister = experimental_createPersister({
  storage: reactQuerySyncStorage,
  maxAge: GC_TIME,
  serialize: stringify,
  deserialize: parse,
});
