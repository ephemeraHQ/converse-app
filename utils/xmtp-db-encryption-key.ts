import { logger } from "@utils/logger";
import { getRandomBytesAsync } from "expo-crypto";
import {
  getSecureItemAsync,
  setSecureItemAsync,
} from "./storage/secure-storage";

const DB_ENCRYPTION_KEY_STORAGE_KEY = "LIBXMTP_DB_ENCRYPTION_KEY";

export async function getDbEncryptionKey() {
  logger.debug("[getDbEncryptionKey] Getting DB encryption key");

  const existingKey = await getSecureItemAsync(DB_ENCRYPTION_KEY_STORAGE_KEY);
  if (existingKey) {
    logger.debug("[getDbEncryptionKey] Found existing DB encryption key");
    return new Uint8Array(Buffer.from(existingKey, "base64"));
  }

  logger.debug("[getDbEncryptionKey] Creating new DB encryption key");
  const newKey = Buffer.from(await getRandomBytesAsync(32));
  await setSecureItemAsync(
    DB_ENCRYPTION_KEY_STORAGE_KEY,
    newKey.toString("base64")
  );

  return new Uint8Array(newKey);
}
