import { logger } from "@utils/logger";
import { getRandomBytesAsync } from "expo-crypto";
import {
  getSecureItemAsync,
  setSecureItemAsync,
  deleteSecureItemAsync,
} from "./storage/secure-storage";

// Returns a 64 bytes key that can be used for multiple things
// 32 bytes is used for XMTP db encryption,
// 16 bytes is used for MMKV secure encryption
export async function getAccountEncryptionKey(
  account: string
): Promise<Buffer> {
  const existingKey = await getSecureItemAsync(
    `CONVERSE_ACCOUNT_ENCRYPTION_KEY_${account}`
  );

  if (existingKey) {
    return Buffer.from(existingKey, "base64");
  }

  logger.debug(
    `[Keychain] Creating account encryption key for account ${account}`
  );

  const newKey = Buffer.from(await getRandomBytesAsync(64));
  await setSecureItemAsync(
    `CONVERSE_ACCOUNT_ENCRYPTION_KEY_${account}`,
    newKey.toString("base64")
  );

  return newKey;
}

export function deleteAccountEncryptionKey(account: string) {
  return deleteSecureItemAsync(`CONVERSE_ACCOUNT_ENCRYPTION_KEY_${account}`);
}
