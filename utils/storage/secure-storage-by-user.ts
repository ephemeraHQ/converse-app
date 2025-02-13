import logger from "@/utils/logger";
import { MMKV } from "react-native-mmkv";
import { getAccountEncryptionKey } from "../keychain";

// Cache of secure MMKV instances by account
export const secureMmkvByUser: Record<string, MMKV> = {};

export async function getSecureStorageForUser(userId: string) {
  if (secureMmkvByUser[userId]) {
    return secureMmkvByUser[userId];
  }

  const encryptionKey = await getAccountEncryptionKey(userId);
  const mmkvStringEncryptionKey = encryptionKey.toString("base64").slice(0, 16);

  secureMmkvByUser[userId] = new MMKV({
    id: `secure-mmkv-${userId}`,
    encryptionKey: mmkvStringEncryptionKey,
  });

  return secureMmkvByUser[userId];
}

export async function clearSecureStorageForUser(userId: string) {
  try {
    const instance = await getSecureStorageForUser(userId);
    instance.clearAll();
  } catch (error) {
    logger.error(error);
  }
  delete secureMmkvByUser[userId];
}
