import logger from "@utils/logger";
import { getRandomBytesAsync } from "expo-crypto";
import * as SecureStore from "expo-secure-store";

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

export const saveXmtpKeys = ({
  inboxId,
  base64Keys,
}: {
  inboxId: string;
  base64Keys: string;
}) => setSecureItemAsync(`XMTP_KEY_${inboxId}`, base64Keys);

export const deleteXmtpKey = async ({ inboxId }: { inboxId: string }) => {
  await deleteSecureItemAsync(`XMTP_KEY_${inboxId}`);
  logger.debug(`[Keychain] Deleted XMTP Key for inboxId ${inboxId}`);
};

export const savePushToken = async (pushKey: string) => {
  await setSecureItemAsync("PUSH_TOKEN", pushKey);
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
