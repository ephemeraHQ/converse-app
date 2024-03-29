import { MMKV } from "react-native-mmkv";
import { StateStorage } from "zustand/middleware";

import { loadXmtpKey } from "./keychain/helpers";

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

const secureMmkvByAccount: { [account: string]: MMKV } = {};

export const getSecureMmkvForAccount = async (account: string) => {
  if (secureMmkvByAccount[account]) return secureMmkvByAccount[account];
  const base64Key = await loadXmtpKey(account);
  if (!base64Key)
    throw new Error("MMKV - Could not find base64 key for account");

  secureMmkvByAccount[account] = new MMKV({
    id: `secure-mmkv-${account}`,
    encryptionKey: base64Key,
  });
  return secureMmkvByAccount[account];
};

export const clearSecureMmkvForAccount = (account: string) => {
  const instance = secureMmkvByAccount[account];
  if (!instance) return;
  instance.clearAll();
  delete secureMmkvByAccount[account];
};
