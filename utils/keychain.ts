import { createHash } from "crypto";
import * as SecureStore from "expo-secure-store";

import config from "../config";

export const saveXmtpKeys = async (keys: string) => {
  await SecureStore.setItemAsync("XMTP_KEYS", keys, {
    keychainService: config.bundleId,
  });
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
    } else {
      // It's v2, let's force the context because the SWIFT SDK wants it
      parsedConversation.context = parsedConversation.context || {
        conversationId: "",
        metadata: {},
      };
    }
    const jsonConversation = JSON.stringify(parsedConversation);
    const key = createHash("sha256").update(topic).digest("hex");
    promises.push(
      SecureStore.setItemAsync(`XMTP_CONVERSATION_${key}`, jsonConversation, {
        keychainService: config.bundleId,
      })
    );
  }
  await Promise.all(promises);
  console.log(`Persisted ${promises.length} exported conversations`);
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
