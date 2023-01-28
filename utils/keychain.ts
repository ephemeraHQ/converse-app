import * as SecureStore from "expo-secure-store";

import config from "../config";

export const saveXmtpKeys = async (keys: string) => {
  await SecureStore.setItemAsync("XMTP_KEYS", keys, {
    keychainService: config.bundleId,
  });
};

export const deleteXmtpKeys = async () => {
  await SecureStore.deleteItemAsync("XMTP_KEYS");
  await SecureStore.deleteItemAsync("XMTP_KEYS", {
    keychainService: config.bundleId,
  });
};

export const loadXmtpKeys = async (): Promise<string | null> => {
  let keys = await SecureStore.getItemAsync("XMTP_KEYS", {
    keychainService: config.bundleId,
  });
  if (!keys) {
    // We used to store them without a service but a service is needed
    // to share it with the Notification extension
    keys = await SecureStore.getItemAsync("XMTP_KEYS");
    if (keys) {
      await saveXmtpKeys(keys);
    }
  }
  return keys;
};
