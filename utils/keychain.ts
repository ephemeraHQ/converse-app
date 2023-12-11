import type { Storage as PrivyStorage } from "@privy-io/js-sdk-core";
import { createHash } from "crypto";
import * as SecureStore from "expo-secure-store";

import { addLog } from "../components/DebugButton";
import config from "../config";
import { sentryTrackMessage } from "./sentry";

export const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainService: config.bundleId,
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export const setSecureItemAsync = (key: string, value: string) =>
  SecureStore.setItemAsync(key, value, secureStoreOptions);

export const getSecureItemAsync = (key: string) =>
  SecureStore.getItemAsync(key, secureStoreOptions);

export const deleteSecureItemAsync = (key: string) =>
  SecureStore.deleteItemAsync(key, secureStoreOptions);

export const saveXmtpKey = (account: string, base64Key: string) =>
  setSecureItemAsync(`XMTP_KEY_${account}`, base64Key);

export const deleteXmtpKey = async (account: string) => {
  await deleteSecureItemAsync(`XMTP_KEY_${account}`);
  console.log(`[Keychain] Deleted XMTP Key for account ${account}`);
};

export const loadXmtpKey = async (account: string): Promise<string | null> =>
  getSecureItemAsync(`XMTP_KEY_${account}`);

// Faster than saving if already exists
const saveIfNotExists = async (key: string, value: string) => {
  const alreadyExists = await getSecureItemAsync(key);
  if (alreadyExists) {
    return;
  }
  await setSecureItemAsync(key, value);
};

export const saveTopicDataToKeychain = async (
  account: string,
  conversationTopicData: { [topic: string]: string }
) => {
  const promises = [];
  const now = new Date().getTime();
  for (const topic in conversationTopicData) {
    const topicData = conversationTopicData[topic];
    const key = createHash("sha256").update(topic).digest("hex");
    promises.push(
      saveIfNotExists(`XMTP_TOPIC_DATA_${account}_${key}`, topicData)
    );
  }
  await Promise.all(promises);
  const after = new Date().getTime();
  console.log(
    `Persisted ${promises.length} exported conversations in ${
      (after - now) / 1000
    } seconds`
  );
};

export const getTopicDataFromKeychain = async (
  account: string,
  topics: string[]
): Promise<string[]> => {
  const keys = topics.map((topic) =>
    createHash("sha256").update(topic).digest("hex")
  );
  const keychainValues = await Promise.all(
    keys.map((key) => getSecureItemAsync(`XMTP_TOPIC_DATA_${account}_${key}`))
  );
  const topicData = keychainValues.filter((v) => !!v) as string[];
  return topicData;
};

export const deleteConversationsFromKeychain = async (
  account: string,
  topics: string[]
) => {
  const promises: Promise<void>[] = [];
  for (const topic of topics) {
    const key = createHash("sha256").update(topic).digest("hex");
    promises.push(deleteSecureItemAsync(`XMTP_TOPIC_DATA_${account}_${key}`));
    // Delete old version of the data (TODO => remove)
    promises.push(deleteSecureItemAsync(`XMTP_CONVERSATION_${key}`));
  }
  await Promise.all(promises);
};

export const savePushToken = async (pushKey: string) => {
  await setSecureItemAsync("PUSH_TOKEN", pushKey);
};

export const privySecureStorage: PrivyStorage = {
  get: (key) => getSecureItemAsync(key.replaceAll(":", "-")),
  put: (key, val: string) => {
    addLog(`Setting ${key} to length ${val ? val.length : val}`);
    if (["privy:token", "privy:refresh_token"].includes(key) && !val) {
      sentryTrackMessage("Logging out of privy, please check logs");
    }
    return setSecureItemAsync(key.replaceAll(":", "-"), val);
  },
  del: (key) => {
    addLog(`Deleting ${key}`);
    if (["privy:token", "privy:refresh_token"].includes(key)) {
      sentryTrackMessage("Logging out of privy, please check logs");
    }
    return deleteSecureItemAsync(key.replaceAll(":", "-"));
  },
  getKeys: async () => [],
};

export const savePrivateKey = async (
  privateKeyPath: string,
  privateKey: string
) =>
  SecureStore.setItemAsync(privateKeyPath, privateKey, {
    keychainService: config.bundleId,
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    // TODO => add biometric authentication
    // requireAuthentication: true,
  });
