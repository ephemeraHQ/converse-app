import { ConsentState, syncConversation, syncConversations } from "@xmtp/react-native-sdk"
import { config } from "@/config"
import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"
import { getXmtpClientByInboxId } from "../xmtp-client/xmtp-client.service"

export async function syncAllXmtpConversations(args: {
  clientInboxId: IXmtpInboxId
  consentStates: ConsentState[]
}) {
  const { clientInboxId, consentStates } = args

  try {
    const client = await getXmtpClientByInboxId({
      inboxId: clientInboxId,
    })

    const beforeSync = new Date().getTime()
    await syncConversations(client.installationId)
    const afterSync = new Date().getTime()

    const timeDiff = afterSync - beforeSync
    if (timeDiff > config.xmtp.maxMsUntilLogError) {
      captureError(
        new XMTPError({
          error: new Error(
            `Syncing conversations from network took ${timeDiff}ms for inboxId ${clientInboxId}`,
          ),
        }),
      )
    }
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Error syncing all conversations for inboxId ${clientInboxId} and consent states ${consentStates.map((c) => c.toString()).join(", ")}`,
    })
  }
}

export async function syncXmtpConversation(args: {
  clientInboxId: IXmtpInboxId
  conversationId: IXmtpConversationId
}) {
  const { clientInboxId, conversationId } = args

  const client = await getXmtpClientByInboxId({
    inboxId: clientInboxId,
  })

  try {
    const beforeSync = new Date().getTime()
    await syncConversation(client.installationId, conversationId)
    const afterSync = new Date().getTime()

    const timeDiff = afterSync - beforeSync
    if (timeDiff > config.xmtp.maxMsUntilLogError) {
      captureError(
        new XMTPError({
          error: new Error(
            `Syncing conversation took ${timeDiff}ms for conversationId ${conversationId}`,
          ),
        }),
      )
    }
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Error syncing conversation ${conversationId}`,
    })
  }
}
