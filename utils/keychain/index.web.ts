// On web, SecureStore does not exist so let's save to mmkv (which will save to localStorage)

import mmkv from "../mmkv";

export const setSecureItemAsync = async (key: string, value: string) =>
  mmkv.set(key, value);

export const getSecureItemAsync = async (key: string) => mmkv.getString(key);

export const deleteSecureItemAsync = async (key: string) => mmkv.delete(key);
