import type { Storage as PrivyStorage } from "@privy-io/js-sdk-core";
import { createHash } from "crypto";
import * as SecureStore from "expo-secure-store";

import {
  deleteSecureItemAsync,
  getSecureItemAsync,
  setSecureItemAsync,
} from ".";
import config from "../../config";
import { addLog } from "../debug";
import { sentryTrackMessage } from "../sentry";

export const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainService: config.bundleId,
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

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
    if (["privy:token", "privy:refresh_token"].includes(key) && !val) {
      sentryTrackMessage("Logging out of privy, please check logs");
    }
    if (key === "privy_core_log") {
      addLog(`Privy log: ${val}`);
    }
    return setSecureItemAsync(key.replaceAll(":", "-"), val);
  },
  del: async (key) => {
    addLog(`Deleting ${key}`);
    if (["privy:token", "privy:refresh_token"].includes(key)) {
      const oldValue = await getSecureItemAsync(key.replaceAll(":", "-"));
      if (oldValue) {
        await setSecureItemAsync(`${key.replaceAll(":", "-")}-old`, oldValue);
      }
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
