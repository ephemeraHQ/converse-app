import { createHash } from "crypto";
import * as SecureStore from "expo-secure-store";

import config from "../config";

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainService: config.bundleId,
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export const saveXmtpKeys = async (keys: string) => {
  await SecureStore.setItemAsync("XMTP_KEYS", keys, secureStoreOptions);
  if (keys) {
    const base64Key = Buffer.from(JSON.parse(keys)).toString("base64");
    await SecureStore.setItemAsync(
      "XMTP_BASE64_KEY",
      base64Key,
      secureStoreOptions
    );
  }
};

export const saveXmtpConversations = async (
  clientAddress: string,
  conversations: string
) => {
  const parsedConversations = JSON.parse(conversations);
  const promises = [];
  for (const parsedConversation of parsedConversations) {
    let topic = parsedConversation.topic;
    if (!topic) {
      // If no topic it's v1, we can build topic
      const addresses = [parsedConversation.peerAddress, clientAddress];
      addresses.sort();
      topic = `/xmtp/0/dm-${addresses[0]}-${addresses[1]}/proto`;
    }
    const jsonConversation = JSON.stringify(parsedConversation);
    const key = createHash("sha256").update(topic).digest("hex");
    promises.push(
      SecureStore.setItemAsync(
        `XMTP_CONVERSATION_${key}`,
        jsonConversation,
        secureStoreOptions
      ).catch((e) => {
        console.log(
          "ERROR WITH",
          `XMTP_CONVERSATION_${key}`,
          jsonConversation,
          e
        );
      })
    );
  }
  await Promise.all(promises);
  console.log(`Persisted ${promises.length} exported conversations`);
};

export const loadXmtpConversation = async (topic: string) => {
  const key = createHash("sha256").update(topic).digest("hex");
  const value = await SecureStore.getItemAsync(
    `XMTP_CONVERSATION_${key}`,
    secureStoreOptions
  );
  return value;
};

export const deleteXmtpConversations = async (topics: string[]) => {
  for (const topic of topics) {
    const key = createHash("sha256").update(topic).digest("hex");
    await SecureStore.deleteItemAsync(
      `XMTP_CONVERSATION_${key}`,
      secureStoreOptions
    );
  }
};

export const deleteXmtpKeys = async () => {
  await SecureStore.deleteItemAsync("XMTP_KEYS");
  await SecureStore.deleteItemAsync("XMTP_KEYS", secureStoreOptions);
  await SecureStore.deleteItemAsync("XMTP_BASE64_KEY", secureStoreOptions);
};

export const loadXmtpKeys = async (): Promise<string | null> => {
  let keys = await SecureStore.getItemAsync("XMTP_KEYS", secureStoreOptions);
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

export const saveExpoPushToken = async (pushKey: string) => {
  await SecureStore.setItemAsync(
    "EXPO_PUSH_TOKEN",
    pushKey,
    secureStoreOptions
  );
};
