import { getRandomBytesAsync } from "expo-crypto"
import { XMTPError } from "@/utils/error"
import { ILowercaseEthereumAddress } from "@/utils/evm/address"
import { xmtpLogger } from "@/utils/logger"
import { secureStorage } from "@/utils/storage/secure-storage"

const DB_ENCRYPTION_KEY_STORAGE_KEY_STRING = "LIBXMTP_DB_ENCRYPTION_KEY"

export async function cleanXmtpDbEncryptionKey(args: { ethAddress: ILowercaseEthereumAddress }) {
  const { ethAddress } = args
  const DB_ENCRYPTION_KEY = getXmtpDbEncryptionStorageKey({ ethAddress })
  await secureStorage.deleteItem(DB_ENCRYPTION_KEY)
}

export async function getOrCreateXmtpDbEncryptionKey(args: {
  ethAddress: ILowercaseEthereumAddress
}) {
  const { ethAddress } = args

  const DB_ENCRYPTION_KEY_STORAGE_KEY = getXmtpDbEncryptionStorageKey({ ethAddress })

  xmtpLogger.debug(`Getting XMTP DB encryption key for ${ethAddress}`)

  try {
    // Check if key exists
    const existingKey = await secureStorage.getItem(DB_ENCRYPTION_KEY_STORAGE_KEY)
    if (existingKey) {
      xmtpLogger.debug(`Found existing DB encryption key for ${ethAddress}`)
      return new Uint8Array(Buffer.from(existingKey, "base64"))
    }

    // Check if key exists in old storage
    // Delete in ~1 month when most people have logged in at least once
    xmtpLogger.debug(
      `No existing DB encryption key found for ${ethAddress}, checking old storage...`,
    )
    const oldExistingKey = await secureStorage.getItem(DB_ENCRYPTION_KEY_STORAGE_KEY_STRING)
    if (oldExistingKey) {
      xmtpLogger.debug(`Found old DB encryption key`)
      await secureStorage.setItem(DB_ENCRYPTION_KEY_STORAGE_KEY, oldExistingKey)
      return new Uint8Array(Buffer.from(oldExistingKey, "base64"))
    }

    // Create new key
    xmtpLogger.debug(
      `Can't find existing DB encryption key for ${ethAddress}, creating a new one...`,
    )
    await secureStorage.setItem(
      DB_ENCRYPTION_KEY_STORAGE_KEY,
      Buffer.from(await getRandomBytesAsync(32)).toString("base64"),
    )
    xmtpLogger.debug(`Created new DB encryption key for ${ethAddress}`)
    return new Uint8Array(Buffer.from(await getRandomBytesAsync(32)))
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "Failed to get or create DB encryption key",
    })
  }
}

function getXmtpDbEncryptionStorageKey(args: { ethAddress: ILowercaseEthereumAddress }) {
  const { ethAddress } = args
  return `${DB_ENCRYPTION_KEY_STORAGE_KEY_STRING}_${ethAddress}`
}
