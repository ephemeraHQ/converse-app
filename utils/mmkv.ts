import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { parse, stringify } from "flatted";
import { MMKV } from "react-native-mmkv";
import { StateStorage } from "zustand/middleware";

import { getAccountEncryptionKey } from "./keychain/helpers";
import logger from "./logger";

const storage = new MMKV();

export default storage;

export const zustandMMKVStorage: StateStorage = {
  setItem: (name, value) => {
    // Deleting before setting to avoid memory leak
    // https://github.com/mrousavy/react-native-mmkv/issues/440
    storage.delete(name);
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

const reactQueryPersister = new MMKV({ id: "converse-react-query" });

export const mmkvStoragePersister = createSyncStoragePersister({
  storage: {
    setItem: (key, value) => {
      // Deleting before setting to avoid memory leak
      // https://github.com/mrousavy/react-native-mmkv/issues/440
      reactQueryPersister.delete(key);
      reactQueryPersister.set(key, value);
    },
    getItem: (key) => {
      const value = reactQueryPersister.getString(key);
      return value === undefined ? null : value;
    },
    removeItem: (key) => {
      reactQueryPersister.delete(key);
    },
  },
  serialize: stringify,
  deserialize: parse,
});
