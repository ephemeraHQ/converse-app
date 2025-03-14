import { PublicIdentity, Client as XmtpClient } from "@xmtp/react-native-sdk"
import { getRandomBytesAsync } from "expo-crypto"
import { config } from "@/config"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"
import { IEthereumAddress } from "@/utils/evm/address"
import { getSecureItemAsync, setSecureItemAsync } from "@/utils/keychain"
import { xmtpLogger } from "@/utils/logger"
import { ISupportedXmtpCodecs, supportedXmtpCodecs } from "../xmtp-codecs/xmtp-codecs"
import { IXmtpClientWithCodecs, IXmtpInboxId, IXmtpSigner } from "../xmtp.types"

export async function createXmtpClientInstance(args: { inboxSigner: IXmtpSigner }) {
  const { inboxSigner } = args

  xmtpLogger.debug(`Creating XMTP client instance`)

  try {
    const startTime = Date.now()
    const client = await XmtpClient.create<ISupportedXmtpCodecs>(inboxSigner, {
      env: config.xmtpEnv,
      dbEncryptionKey: await getDbEncryptionKey(),
      codecs: supportedXmtpCodecs,
    })
    const end = Date.now()

    const duration = end - startTime
    if (duration > config.xmtp.maxMsUntilLogError) {
      captureError(
        new XMTPError({
          error: new Error(`Creating XMTP client took ${duration}ms`),
        }),
      )
    }

    return client as IXmtpClientWithCodecs
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "Failed to create XMTP client instance",
    })
  }
}

export async function buildXmtpClientInstance(args: {
  ethereumAddress: IEthereumAddress
  inboxId?: IXmtpInboxId
}) {
  const { ethereumAddress, inboxId } = args

  xmtpLogger.debug(`Building XMTP client for address: ${ethereumAddress}`)

  try {
    const startTime = Date.now()

    const client = await XmtpClient.build<ISupportedXmtpCodecs>(
      new PublicIdentity(ethereumAddress, "ETHEREUM"),
      {
        env: config.xmtpEnv,
        codecs: supportedXmtpCodecs,
        dbEncryptionKey: await getDbEncryptionKey(),
      },
      inboxId,
    )

    const end = Date.now()

    const duration = end - startTime
    if (duration > config.xmtp.maxMsUntilLogError) {
      captureError(
        new XMTPError({
          error: new Error(
            `Building XMTP client took ${duration}ms for address: ${ethereumAddress}`,
          ),
        }),
      )
    }

    return client as IXmtpClientWithCodecs
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
