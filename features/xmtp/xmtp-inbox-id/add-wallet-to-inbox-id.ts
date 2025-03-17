import { IXmtpInboxId, IXmtpSigner } from "@features/xmtp/xmtp.types"
import { config } from "@/config"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"
import { xmtpLogger } from "@/utils/logger"
import { getXmtpClientByInboxId } from "../xmtp-client/xmtp-client"

export async function addWalletToInboxId(args: {
  inboxId: IXmtpInboxId
  wallet: IXmtpSigner
  allowReassignInboxId?: boolean
}) {
  const { inboxId, wallet, allowReassignInboxId = false } = args

  const walletIdentifier = await wallet.getIdentifier()

  xmtpLogger.debug(
    `[addWalletToInboxId] Adding wallet ${walletIdentifier} to inbox ID: ${inboxId} with allowReassignInboxId: ${allowReassignInboxId}`,
  )

  try {
    const client = await getXmtpClientByInboxId({
      inboxId,
    })

    const beforeMs = new Date().getTime()
    await client.addAccount(wallet, allowReassignInboxId)

    const afterMs = new Date().getTime()
    const timeDiffMs = afterMs - beforeMs

    if (timeDiffMs > config.xmtp.maxMsUntilLogError) {
      captureError(
        new XMTPError({
          error: new Error(`Adding wallet to inbox ID took ${timeDiffMs}ms for inboxId ${inboxId}`),
        }),
      )
    }

    return client
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Error adding wallet ${walletIdentifier} to inbox ID for inboxId ${inboxId}`,
    })
  }
}
