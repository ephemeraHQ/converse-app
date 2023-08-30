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

export const saveXmtpConversationIfNeeded = async (
  key: string,
  jsonConversation: string
) => {
  try {
    const alreadyExists = await SecureStore.getItemAsync(
      `XMTP_CONVERSATION_${key}`,
      secureStoreOptions
    );
    if (alreadyExists) {
      return;
    }
    await SecureStore.setItemAsync(
      `XMTP_CONVERSATION_${key}`,
      jsonConversation,
      secureStoreOptions
    );
  } catch (e) {
    console.log("ERROR WITH", `XMTP_CONVERSATION_${key}`, jsonConversation, e);
  }
};

export const saveXmtpConversations = async (
  clientAddress: string,
  conversations: string
) => {
  const parsedConversations = JSON.parse(conversations);
  const promises = [];
  const now = new Date().getTime();
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
    promises.push(saveXmtpConversationIfNeeded(key, jsonConversation));
  }
  await Promise.all(promises);
  const after = new Date().getTime();
  console.log(
    `Persisted ${promises.length} exported conversations in ${
      (after - now) / 1000
    } seconds`
  );
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

export const saveExpoPushToken = async (pushKey: string) => {
  await SecureStore.setItemAsync(
    "EXPO_PUSH_TOKEN",
    pushKey,
    secureStoreOptions
  );
};
