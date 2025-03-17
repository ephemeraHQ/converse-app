import { findInboxIdFromIdentity, PublicIdentity } from "@xmtp/react-native-sdk"
import { config } from "@/config"
import { ensureXmtpInstallationQueryData } from "@/features/xmtp/xmtp-installations/xmtp-installation.query"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { GenericError, XMTPError } from "@/utils/error"
import { IEthereumAddress } from "@/utils/evm/address"
import { xmtpLogger } from "@/utils/logger"

export async function getInboxIdFromEthAddress(args: {
  clientInboxId: IXmtpInboxId
  targetEthAddress: IEthereumAddress
}) {
  const { clientInboxId, targetEthAddress } = args

  xmtpLogger.debug(
    `[getInboxIdFromEthAddress] Getting inbox ID from Ethereum address: ${targetEthAddress} for client: ${clientInboxId}`,
  )

  if (!clientInboxId) {
    throw new GenericError({
      error: new Error("Invalid client inbox ID"),
      additionalMessage: "Invalid client inbox ID",
    })
  }

  if (!targetEthAddress) {
    throw new GenericError({
      error: new Error("Invalid target Ethereum address"),
      additionalMessage: "Invalid target Ethereum address",
    })
  }

  const installationId = await ensureXmtpInstallationQueryData({
    inboxId: clientInboxId,
  })

  try {
    const lookupStartTime = Date.now()
    const inboxId = (await findInboxIdFromIdentity(
      installationId,
      new PublicIdentity(targetEthAddress, "ETHEREUM"),
    )) as unknown as IXmtpInboxId
    const lookupEndTime = Date.now()

    const lookupDuration = lookupEndTime - lookupStartTime

    if (lookupDuration > config.xmtp.maxMsUntilLogError) {
      captureError(
        new XMTPError({
          error: new Error(
            `Inbox lookup took ${lookupDuration}ms for target address: ${targetEthAddress}`,
          ),
        }),
      )
    }

    return inboxId
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: "failed to get inbox ID from address",
    })
  }
}
