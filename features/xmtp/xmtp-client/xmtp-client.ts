import { IXmtpClientWithCodecs, IXmtpInboxId, IXmtpSigner } from "@features/xmtp/xmtp.types"
import { PublicIdentity, Client as XmtpClient } from "@xmtp/react-native-sdk"
import Constants from "expo-constants"
import { config } from "@/config"
import { useMultiInboxStore } from "@/features/authentication/multi-inbox.store"
import {
  cleanXmtpDbEncryptionKey,
  getOrCreateXmtpDbEncryptionKey,
} from "@/features/xmtp/xmtp-client/xmtp-client-db-encryption-key"
import { ISupportedXmtpCodecs, supportedXmtpCodecs } from "@/features/xmtp/xmtp-codecs/xmtp-codecs"
import { xmtpIdentityIsEthereumAddress } from "@/features/xmtp/xmtp-identifier/xmtp-identifier"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"
import { IEthereumAddress, lowercaseEthAddress } from "@/utils/evm/address"
import { xmtpLogger } from "@/utils/logger"
import { tryCatchWithDuration } from "@/utils/try-catch"

// A simple map to store XMTP clients by inboxId
const xmtpClientsMap = new Map<IXmtpInboxId, IXmtpClientWithCodecs>()

// Simple cache to prevent multiple builds for the same ethereum address
const buildPromisesCache = new Map<IEthereumAddress, Promise<IXmtpClientWithCodecs>>()

/**
 * Gets an XMTP client by inboxId, building it if necessary
 */
export async function getXmtpClientByInboxId(args: { inboxId: IXmtpInboxId }) {
  const { inboxId } = args

  try {
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

    const client = await buildXmtpClientInstance({
      ethereumAddress: sender.ethereumAddress,
      inboxId,
    })

    // Store in map
    xmtpClientsMap.set(inboxId, client)

    return client
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Failed to get XMTP client for inboxId: ${inboxId}`,
    })
  }
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

  const dbEncryptionKey = await getOrCreateXmtpDbEncryptionKey({
    ethAddress: lowercaseEthAddress(identity.identifier),
  })

  xmtpLogger.debug(`Creating XMTP client instance...`)
  const { data, error, durationMs } = await tryCatchWithDuration(
    XmtpClient.create<ISupportedXmtpCodecs>(inboxSigner, {
      env: config.xmtp.env,
      dbEncryptionKey,
      codecs: supportedXmtpCodecs,
      ...(config.xmtp.env === "local" && {
        customLocalUrl: getXmtpLocalUrl(),
      }),
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

  try {
    // Check if there's already a build in progress for this address
    const existingBuildPromise = buildPromisesCache.get(ethereumAddress)
    if (existingBuildPromise) {
      return existingBuildPromise
    }

    // Create a new build promise
    const buildPromise = (async () => {
      try {
        const startTime = Date.now()

        const dbEncryptionKey = await getOrCreateXmtpDbEncryptionKey({
          ethAddress: lowercaseEthAddress(ethereumAddress),
        })

        const client = await XmtpClient.build<ISupportedXmtpCodecs>(
          new PublicIdentity(ethereumAddress, "ETHEREUM"),
          {
            env: config.xmtp.env,
            codecs: supportedXmtpCodecs,
            dbEncryptionKey,
            ...(config.xmtp.env === "local" && {
              customLocalUrl: getXmtpLocalUrl(),
            }),
          },
          inboxId,
        )

        const duration = Date.now() - startTime
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
      } finally {
        // Always clean up the cache entry when done
        buildPromisesCache.delete(ethereumAddress)
      }
    })()

    // Store the promise in cache
    buildPromisesCache.set(ethereumAddress, buildPromise)

    xmtpLogger.debug(`Building XMTP client for address: ${ethereumAddress}`)

    return buildPromise
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Failed to build XMTP client for address: ${ethereumAddress}`,
    })
  }
}

/**
 * Logs out an XMTP client and properly cleans up resources
 * If deleteDatabase is true, the local message database will be deleted
 * Important: If the database is deleted, all message history will be lost
 */
export async function logoutXmtpClient(
  args:
    | {
        inboxId: IXmtpInboxId
        ethAddress: IEthereumAddress
        deleteDatabase: true
      }
    | {
        inboxId: IXmtpInboxId
        ethAddress?: never
        deleteDatabase?: false
      },
) {
  const { inboxId, ethAddress, deleteDatabase = false } = args

  xmtpLogger.debug(`Logging out XMTP client for inboxId: ${inboxId}`)

  try {
    // Get the client from the map
    const xmtpClient = xmtpClientsMap.get(inboxId)

    if (xmtpClient) {
      // If requested, delete the local database
      if (deleteDatabase) {
        xmtpLogger.debug(`Deleting local database for inboxId: ${inboxId}`)
        await xmtpClient.deleteLocalDatabase()
      }

      // Drop the client from XMTP
      xmtpLogger.debug(`Dropping client for inboxId: ${inboxId}`)
      await XmtpClient.dropClient(xmtpClient.installationId)

      // Remove from our local map
      xmtpClientsMap.delete(inboxId)
    } else {
      xmtpLogger.debug(`No client found in map for inboxId: ${inboxId}`)
    }

    // Always clean up encryption key if we're deleting the database
    if (deleteDatabase && ethAddress) {
      await cleanXmtpDbEncryptionKey({ ethAddress: lowercaseEthAddress(ethAddress) })
      xmtpLogger.debug(`Cleaned DB encryption key for address: ${ethAddress}`)
    }

    xmtpLogger.debug(`Successfully logged out XMTP client for inboxId: ${inboxId}`)
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Failed to properly logout XMTP client for inboxId: ${inboxId}`,
    })
  }
}

// Useful for debugging on physical devices
function getXmtpLocalUrl() {
  const hostIp = Constants.expoConfig?.hostUri?.split(":")[0]

  if (!hostIp) {
    throw new XMTPError({
      error: new Error("No host IP found"),
      additionalMessage: "Failed to get device IP for local XMTP environment",
    })
  }

  // XMTP SDK actually wants the host IP and not the full url
  return hostIp
}
