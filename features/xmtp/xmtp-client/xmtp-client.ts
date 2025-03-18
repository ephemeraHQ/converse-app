import { IXmtpClientWithCodecs, IXmtpInboxId, IXmtpSigner } from "@features/xmtp/xmtp.types"
import { PublicIdentity, Client as XmtpClient } from "@xmtp/react-native-sdk"
import { getRandomBytesAsync } from "expo-crypto"
import { config } from "@/config"
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import { ISupportedXmtpCodecs, supportedXmtpCodecs } from "@/features/xmtp/xmtp-codecs/xmtp-codecs"
import { xmtpIdentityIsEthereumAddress } from "@/features/xmtp/xmtp-identifier/xmtp-identifier"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"
import { IEthereumAddress } from "@/utils/evm/address"
import { getSecureItemAsync, setSecureItemAsync } from "@/utils/keychain"
import { xmtpLogger } from "@/utils/logger"
import { tryCatchWithDuration } from "@/utils/try-catch"

// A simple map to store XMTP clients by inboxId
const xmtpClientsMap = new Map<IXmtpInboxId, IXmtpClientWithCodecs>()

/**
 * Gets an XMTP client by inboxId, creating it if necessary
 */
export async function getXmtpClientByInboxId(args: { inboxId: IXmtpInboxId }) {
  const { inboxId } = args

  // Check if client already exists in map
  const existingClient = xmtpClientsMap.get(inboxId)
  if (existingClient) {
    return existingClient
  }

  // Try to get from store
  const sender = useMultiInboxStore.getState().senders.find((s) => s.inboxId === inboxId)
  if (!sender) {
    throw new XMTPError({
      error: new Error(`No sender found for inboxId: ${inboxId}`),
    })
  }

  // Create client using the ethereum address
  const client = await buildXmtpClientInstance({
    ethereumAddress: sender.ethereumAddress,
    inboxId,
  })

  // Store in map
  xmtpClientsMap.set(inboxId, client)
  xmtpLogger.debug(`Created and stored XMTP client for inboxId: ${inboxId}`)

  return client
}

/**
 * Creates a new XMTP client using a signer
 */
export async function createXmtpClient(args: { inboxSigner: IXmtpSigner }) {
  const { inboxSigner } = args

  const identity = await inboxSigner.getIdentifier()

  if (!xmtpIdentityIsEthereumAddress(identity)) {
    throw new XMTPError({
      error: new Error("Identifier is not an Ethereum address"),
    })
  }

  // Create new client
  xmtpLogger.debug(`Creating XMTP client instance`)

  const { data, error, durationMs } = await tryCatchWithDuration(
    XmtpClient.create<ISupportedXmtpCodecs>(inboxSigner, {
      env: config.xmtpEnv,
      dbEncryptionKey: await getDbEncryptionKey(),
      codecs: supportedXmtpCodecs,
    }),
  )

  if (error) {
    throw new XMTPError({
      error,
      additionalMessage: "Failed to create XMTP client instance",
    })
  }

  if (durationMs > config.xmtp.maxMsUntilLogError) {
    captureError(
      new XMTPError({
        error: new Error(`Creating XMTP client took ${durationMs}ms`),
      }),
    )
  }

  const xmtpClient = data as IXmtpClientWithCodecs

  xmtpLogger.debug(`Created XMTP client instance`)

  // Store in map
  const inboxId = xmtpClient.inboxId as IXmtpInboxId
  xmtpClientsMap.set(inboxId, xmtpClient)
  xmtpLogger.debug(`Created and stored XMTP client for inboxId: ${inboxId}`)

  return xmtpClient
}

/**
 * Builds an XMTP client instance using an ethereum address
 */
async function buildXmtpClientInstance(args: {
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

/**
 * Gets or creates the database encryption key
 */
async function getDbEncryptionKey() {
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
