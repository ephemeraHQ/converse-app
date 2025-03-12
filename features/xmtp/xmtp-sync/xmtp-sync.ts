import { ConsentState, InboxId } from "@xmtp/react-native-sdk"
import { config } from "@/config"
import { getXmtpClientByInboxId } from "@/features/xmtp/xmtp-client/xmtp-client.service"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"

export async function syncAllXmtpConversations(args: {
  clientInboxId: InboxId
  consentStates: ConsentState[]
}) {
  const { clientInboxId, consentStates } = args

  try {
    const client = await getXmtpClientByInboxId({
      inboxId: clientInboxId,
    })

    const start = new Date().getTime()
    await client.conversations.syncAllConversations(consentStates)
    const end = new Date().getTime()

    const duration = end - start

    if (duration > config.xmtp.maxMsUntilLogError) {
      captureError(
        new XMTPError({
          error: new Error(
            `Syncing conversations from network took ${duration}ms for inbox ${clientInboxId}`,
          ),
          additionalMessage: "XMTP sync performance warning",
        }),
      )
    }
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Failed to sync conversations for inbox: ${clientInboxId}`,
    })
  }
}
