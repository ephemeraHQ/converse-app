import { createHash } from "crypto";
import * as SecureStore from "expo-secure-store";

import config from "../config";

export const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainService: config.bundleId,
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export const saveXmtpKey = (account: string, base64Key: string) =>
  SecureStore.setItemAsync(
    `XMTP_KEY_${account}`,
    base64Key,
    secureStoreOptions
  );

export const deleteXmtpKey = async (account: string) => {
  await SecureStore.deleteItemAsync(`XMTP_KEY_${account}`, secureStoreOptions);
  console.log(`[Keychain] Deleted XMTP Key for account ${account}`);
};

export const loadXmtpKey = async (account: string): Promise<string | null> =>
  SecureStore.getItemAsync(`XMTP_KEY_${account}`, secureStoreOptions);

// Faster than saving if already exists
const saveIfNotExists = async (key: string, value: string) => {
  const alreadyExists = await SecureStore.getItemAsync(key, secureStoreOptions);
  if (alreadyExists) {
    return;
  }
  await SecureStore.setItemAsync(key, value, secureStoreOptions);
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
    keys.map((key) =>
      SecureStore.getItemAsync(
        `XMTP_TOPIC_DATA_${account}_${key}`,
        secureStoreOptions
      )
    )
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
    promises.push(
      SecureStore.deleteItemAsync(
        `XMTP_TOPIC_DATA_${account}_${key}`,
        secureStoreOptions
      )
    );
    // Delete old version of the data (TODO => remove)
    promises.push(
      SecureStore.deleteItemAsync(
        `XMTP_CONVERSATION_${key}`,
        secureStoreOptions
      )
    );
  }
  await Promise.all(promises);
};

export const savePushToken = async (pushKey: string) => {
  await SecureStore.setItemAsync("PUSH_TOKEN", pushKey, secureStoreOptions);
};
