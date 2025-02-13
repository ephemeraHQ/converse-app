import * as SecureStore from "expo-secure-store";

export function setSecureItemAsync(key: string, value: string) {
  return SecureStore.setItemAsync(key, value);
}

export function getSecureItemAsync(key: string) {
  return SecureStore.getItemAsync(key);
}

export function deleteSecureItemAsync(key: string) {
  return SecureStore.deleteItemAsync(key);
}
