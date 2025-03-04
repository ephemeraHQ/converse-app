import { InboxId } from "@xmtp/react-native-sdk"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"
import { getXmtpClientByInboxId } from "../xmtp-client/xmtp-client.service"
import { IXmtpSigner } from "../xmtp.types"

export async function addWalletToInboxId(args: {
  inboxId: InboxId
  wallet: IXmtpSigner
  allowReassignInboxId?: boolean
}) {
  const { inboxId, wallet, allowReassignInboxId = false } = args

  try {
    const beforeMs = new Date().getTime()

    const client = await getXmtpClientByInboxId({
      inboxId,
    })

    await client.addAccount(wallet, allowReassignInboxId)

    const afterMs = new Date().getTime()
    const timeDiffMs = afterMs - beforeMs

    if (timeDiffMs > 3000) {
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
      additionalMessage: `Error adding wallet to inbox ID for inboxId ${inboxId}`,
    })
  }
}
