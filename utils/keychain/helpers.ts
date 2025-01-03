// import type { Storage as PrivyStorage } from "@privy-io/js-sdk-core";
import logger from "@utils/logger";
import { createHash } from "crypto";
import { getRandomBytesAsync } from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { v4 as uuidv4 } from "uuid";

import {
  deleteSecureItemAsync,
  getSecureItemAsync,
  setSecureItemAsync,
} from ".";
import config from "../../config";

export const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainService: config.bundleId,
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export const saveXmtpKey = (
  { inboxId }: { inboxId: string },
  base64Key: string
) => setSecureItemAsync(`XMTP_KEY_${inboxId}`, base64Key);

export const deleteXmtpKey = async ({ inboxId }: { inboxId: string }) => {
  await deleteSecureItemAsync(`XMTP_KEY_${inboxId}`);
  logger.debug(`[Keychain] Deleted XMTP Key for inboxId ${inboxId}`);
};

export const loadXmtpKey = async ({
  inboxId,
}: {
  inboxId: string;
}): Promise<string | null> => getSecureItemAsync(`XMTP_KEY_${inboxId}`);

export const getTopicDataFromKeychain = async (
  { inboxId }: { inboxId: string },
  topics: string[]
): Promise<string[]> => {
  const keys = topics.map((topic) =>
    createHash("sha256").update(topic).digest("hex")
  );
  const keychainValues = await Promise.all(
    keys.map((key) => getSecureItemAsync(`XMTP_TOPIC_DATA_${inboxId}_${key}`))
  );
  const topicData = keychainValues.filter((v) => !!v) as string[];
  return topicData;
};

export const deleteConversationsFromKeychain = async (
  { inboxId }: { inboxId: string },
  topics: string[]
) => {
  const promises: Promise<void>[] = [];
  for (const topic of topics) {
    const key = createHash("sha256").update(topic).digest("hex");
    promises.push(deleteSecureItemAsync(`XMTP_TOPIC_DATA_${inboxId}_${key}`));
    // Delete old version of the data (TODO => remove)
    promises.push(deleteSecureItemAsync(`XMTP_CONVERSATION_${key}`));
  }
  await Promise.all(promises);
};

export const savePushToken = async (pushKey: string) => {
  await setSecureItemAsync("PUSH_TOKEN", pushKey);
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

export const getDeviceId = async () => {
  const deviceId = await SecureStore.getItemAsync("CONVERSE_DEVICE_ID");
  if (deviceId) return deviceId;
  const newDeviceId = uuidv4();
  await SecureStore.setItemAsync("CONVERSE_DEVICE_ID", newDeviceId);
  return newDeviceId;
};

// Returns a 64 bytes key that can be used for multiple things
// 32 bytes is used for XMTP db encryption,
// 16 bytes is used for MMKV secure encryption
export const getEncryptionKeyByInboxId = async ({
  inboxId,
}: {
  inboxId: string;
}): Promise<Buffer> => {
  const existingKey = await getSecureItemAsync(
    `CONVERSE_INBOX_ID_ENCRYPTION_KEY_${inboxId}`
  );
  if (existingKey) {
    return Buffer.from(existingKey, "base64");
  }
  logger.debug(
    `[Keychain] Creating inboxId encryption key for inboxId ${inboxId}`
  );
  const newKey = Buffer.from(await getRandomBytesAsync(64));
  await setSecureItemAsync(
    `CONVERSE_INBOX_ID_ENCRYPTION_KEY_${inboxId}`,
    newKey.toString("base64")
  );
  return newKey;
};

export const removeInboxIdEncryptionKeyFromStorage = ({
  inboxId,
}: {
  inboxId: string;
}) => deleteSecureItemAsync(`CONVERSE_INBOX_ID_ENCRYPTION_KEY_${inboxId}`);

export const getDbEncryptionKey = async () => {
  const existingKey = await getSecureItemAsync("LIBXMTP_DB_ENCRYPTION_KEY");
  if (existingKey) {
    return new Uint8Array(Buffer.from(existingKey, "base64"));
  }
  const newKey = Buffer.from(await getRandomBytesAsync(32));
  await setSecureItemAsync(
    "LIBXMTP_DB_ENCRYPTION_KEY",
    newKey.toString("base64")
  );
  return new Uint8Array(newKey);
};

export const getDbEncryptionSalt = async () => {
  const existingSalt = await getSecureItemAsync("CONVERSE_DB_ENCRYPTION_SALT");
  if (existingSalt) {
    return existingSalt;
  }
  const newKey = Buffer.from(await getRandomBytesAsync(16));
  const newKeyHex = newKey.toString("hex");
  await setSecureItemAsync("CONVERSE_DB_ENCRYPTION_SALT", newKeyHex);
  return newKeyHex;
};
