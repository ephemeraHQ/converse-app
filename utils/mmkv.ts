import { GC_TIME } from "@queries/queryClient.constants";
import { experimental_createPersister } from "@tanstack/react-query-persist-client";
import { parse, stringify } from "flatted";
import { MMKV } from "react-native-mmkv";
import { StateStorage } from "zustand/middleware";

import { getAccountEncryptionKey } from "./keychain/helpers";
import logger from "./logger";

const storage = new MMKV();

export default storage;

const authMMKV = new MMKV({ id: "converse-auth" });

type AuthStorageKey = "CONVERSE_REFRESH_TOKEN" | "CONVERSE_ACCESS_TOKEN";

export const authMMKVStorage = {
  set(name: AuthStorageKey, value: string) {
    // Deleting before setting to avoid memory leak
    // https://github.com/mrousavy/react-native-mmkv/issues/440
    authMMKV.delete(name);
    return authMMKV.set(name, value);
  },
  get(name: AuthStorageKey) {
    const value = authMMKV.getString(name);
    return value ?? null;
  },
  delete(name: AuthStorageKey) {
    return authMMKV.delete(name);
  },
  clear() {
    return authMMKV.clearAll();
  },
};

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

export const secureMmkvByAccount: { [account: string]: MMKV } = {};

export const getSecureMmkvForAccount = async (account: string) => {
  if (secureMmkvByAccount[account]) return secureMmkvByAccount[account];
  const encryptionKey = await getAccountEncryptionKey(account);
  const mmkvStringEncryptionKey = encryptionKey.toString("base64").slice(0, 16);

  secureMmkvByAccount[account] = new MMKV({
    id: `secure-mmkv-${account}`,
    encryptionKey: mmkvStringEncryptionKey,
  });
  return secureMmkvByAccount[account];
};

export const clearSecureMmkvForAccount = async (account: string) => {
  try {
    const instance = await getSecureMmkvForAccount(account);
    instance.clearAll();
  } catch (e) {
    logger.error(e);
  }
  delete secureMmkvByAccount[account];
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
