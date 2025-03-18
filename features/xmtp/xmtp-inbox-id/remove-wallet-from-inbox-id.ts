import { PublicIdentity } from "@xmtp/react-native-sdk"
import { config } from "@/config"
import { IXmtpInboxId, IXmtpSigner } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"
import { xmtpLogger } from "@/utils/logger"
import { getXmtpClientByInboxId } from "../xmtp-client/xmtp-client"

export async function removeWalletFromInboxId(args: {
  inboxId: IXmtpInboxId
  signer: IXmtpSigner
  ethAddressToRemove: string
}) {
  const { inboxId, signer, ethAddressToRemove } = args

  xmtpLogger.debug(
    `[removeWalletFromInboxId] Removing wallet address ${ethAddressToRemove} from inbox ID: ${inboxId}`,
  )

  try {
    const client = await getXmtpClientByInboxId({
      inboxId,
    })

    const beforeMs = new Date().getTime()
    await client.removeAccount(signer, new PublicIdentity(ethAddressToRemove, "ETHEREUM"))
    const afterMs = new Date().getTime()

    const timeDiffMs = afterMs - beforeMs

    if (timeDiffMs > config.xmtp.maxMsUntilLogError) {
      captureError(
        new XMTPError({
          error: new Error(
            `Removing wallet address ${ethAddressToRemove} from inbox ID ${inboxId} took ${timeDiffMs}ms`,
          ),
        }),
      )
    }

    return client
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Error removing wallet address ${ethAddressToRemove} from inbox ID ${inboxId}`,
    })
  }
}
