import { MMKV } from "react-native-mmkv";
import { StateStorage } from "zustand/middleware";

import { getAccountEncryptionKey } from "./keychain/helpers";

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
    console.error(e);
  }
  delete secureMmkvByAccount[account];
};
