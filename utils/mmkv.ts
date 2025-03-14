import { MMKV } from "react-native-mmkv"
import { StateStorage } from "zustand/middleware"
import { captureError } from "@/utils/capture-error"
import { getAccountEncryptionKey } from "./keychain"
import logger from "./logger"

/**
 * Default MMKV storage instance
 */
const storage = new MMKV()

export default storage

/**
 * Zustand storage adapter for MMKV
 */
export const zustandMMKVStorage: StateStorage = {
  setItem(name, value) {
    // Deleting before setting to avoid memory leak
    // https://github.com/mrousavy/react-native-mmkv/issues/440
    storage.delete(name)
    return storage.set(name, value)
  },
  getItem(name) {
    const value = storage.getString(name)
    return value ?? null
  },
  removeItem(name) {
    return storage.delete(name)
  },
}

/**
 * Map of secure MMKV instances by account
 */
export const secureMmkvByAccount: { [account: string]: MMKV } = {}

/**
 * Gets or creates a secure MMKV instance for the specified account
 */
export const getSecureMmkvForAccount = async (account: string) => {
  if (secureMmkvByAccount[account]) return secureMmkvByAccount[account]
  const encryptionKey = await getAccountEncryptionKey(account)
  const mmkvStringEncryptionKey = encryptionKey.toString("base64").slice(0, 16)

  secureMmkvByAccount[account] = new MMKV({
    id: `secure-mmkv-${account}`,
    encryptionKey: mmkvStringEncryptionKey,
  })
  return secureMmkvByAccount[account]
}

/**
 * Clears the secure MMKV instance for the specified account
 */
export const clearSecureMmkvForAccount = async (account: string) => {
  try {
    const instance = await getSecureMmkvForAccount(account)
    instance.clearAll()
  } catch (e) {
    logger.error(e)
  }
  delete secureMmkvByAccount[account]
}
