import { PublicIdentity, Client as XmtpClient } from "@xmtp/react-native-sdk"
import { getRandomBytesAsync } from "expo-crypto"
import { config } from "@/config"
import { XMTP_MAX_MS_UNTIL_LOG_ERROR } from "@/features/xmtp/xmtp-logs"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"
import { getSecureItemAsync, setSecureItemAsync } from "@/utils/keychain"
import { xmtpLogger } from "@/utils/logger"
import { ISupportedXmtpCodecs, supportedXmtpCodecs } from "../xmtp-codecs/xmtp-codecs"
import { IXmtpClient, IXmtpInboxId, IXmtpSigner } from "../xmtp.types"

export async function createXmtpClientInstance(args: {
  inboxSigner: IXmtpSigner
}): Promise<IXmtpClient> {
  const { inboxSigner } = args
  const startTime = Date.now()

  xmtpLogger.debug(`Creating XMTP client instance`)

  try {
    const client = await XmtpClient.create<ISupportedXmtpCodecs>(inboxSigner, {
      env: config.xmtpEnv,
      dbEncryptionKey: await getDbEncryptionKey(),
      codecs: supportedXmtpCodecs,
    })

    const duration = Date.now() - startTime
    if (duration > XMTP_MAX_MS_UNTIL_LOG_ERROR) {
      captureError(
        new XMTPError({
          error: new Error(`Creating XMTP client took ${duration}ms`),
        }),
      )
    }

    return client
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "Failed to create XMTP client instance",
    })
  }
}

export async function buildXmtpClientInstance(args: {
  ethereumAddress: string
  inboxId?: IXmtpInboxId
}) {
  const { ethereumAddress, inboxId } = args

  xmtpLogger.debug(`Building XMTP client for address: ${ethereumAddress}`)

  const startTime = Date.now()

  const identity = new PublicIdentity(ethereumAddress, "ETHEREUM")

  try {
    const client = await XmtpClient.build<ISupportedXmtpCodecs>(
      identity,
      {
        env: config.xmtpEnv,
        codecs: supportedXmtpCodecs,
        dbEncryptionKey: await getDbEncryptionKey(),
      },
      inboxId,
    )

    const duration = Date.now() - startTime
    if (duration > XMTP_MAX_MS_UNTIL_LOG_ERROR) {
      captureError(
        new XMTPError({
          error: new Error(
            `Building XMTP client took ${duration}ms for address: ${ethereumAddress}`,
          ),
        }),
      )
    }

    return client
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Failed to build XMTP client for address: ${ethereumAddress}`,
    })
  }
}

export async function getDbEncryptionKey() {
  const DB_ENCRYPTION_KEY = "LIBXMTP_DB_ENCRYPTION_KEY"

  xmtpLogger.debug(`Getting DB encryption key`)

  try {
    const existingKey = await getSecureItemAsync(DB_ENCRYPTION_KEY)

    if (existingKey) {
      xmtpLogger.debug(`Found existing DB encryption key`)
      return new Uint8Array(Buffer.from(existingKey, "base64"))
    }

    xmtpLogger.debug(`Creating new DB encryption key`)
    const newKey = Buffer.from(await getRandomBytesAsync(32))
    await setSecureItemAsync(DB_ENCRYPTION_KEY, newKey.toString("base64"))

    return new Uint8Array(newKey)
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "Failed to get or create DB encryption key",
    })
  }
}
