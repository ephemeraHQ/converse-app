import { PublicIdentity } from "@xmtp/react-native-sdk"
import { captureError } from "@/utils/capture-error"
import { GenericError, XMTPError } from "@/utils/error"
import { IEthereumAddress } from "@/utils/evm/address"
import { xmtpLogger } from "@/utils/logger"
import { tryCatch } from "@/utils/try-catch"
import { getXmtpClientByEthAddress } from "../xmtp-client/xmtp-client.service"

export async function getInboxIdFromEthAddress(args: {
  clientEthAddress: IEthereumAddress
  targetEthAddress: IEthereumAddress
}) {
  const { clientEthAddress, targetEthAddress } = args

  xmtpLogger.debug(
    `[getInboxIdFromEthAddress] Getting inbox ID from Ethereum address: ${targetEthAddress} for client: ${clientEthAddress}`,
  )

  if (!clientEthAddress) {
    throw new GenericError({
      error: new Error("Invalid client Ethereum address"),
      additionalMessage: "Invalid client Ethereum address",
    })
  }

  if (!targetEthAddress) {
    throw new GenericError({
      error: new Error("Invalid target Ethereum address"),
      additionalMessage: "Invalid target Ethereum address",
    })
  }

  const { data: client, error } = await tryCatch(
    getXmtpClientByEthAddress({
      ethAddress: clientEthAddress,
    }),
  )

  if (error) {
    throw new XMTPError({
      error,
      additionalMessage: "failed to get XMTP client",
    })
  }

  try {
    const lookupStartTime = Date.now()
    const inboxId = await client.findInboxIdFromIdentity(
      new PublicIdentity(targetEthAddress, "ETHEREUM"),
    )
    const lookupEndTime = Date.now()

    const lookupDuration = lookupEndTime - lookupStartTime

    if (lookupDuration > 3000) {
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
