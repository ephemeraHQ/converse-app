import * as SecureStore from "expo-secure-store";

import { secureStoreOptions } from "./helpers";

export const setSecureItemAsync = (key: string, value: string) =>
  SecureStore.setItemAsync(key, value, secureStoreOptions);

export const getSecureItemAsync = (key: string) =>
  SecureStore.getItemAsync(key, secureStoreOptions);

export const deleteSecureItemAsync = (key: string) =>
  SecureStore.deleteItemAsync(key, secureStoreOptions);
