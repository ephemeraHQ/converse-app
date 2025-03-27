import { ConsentState, syncAllConversations, syncConversation } from "@xmtp/react-native-sdk"
import { config } from "@/config"
import { ensureXmtpInstallationQueryData } from "@/features/xmtp/xmtp-installations/xmtp-installation.query"
import { IXmtpConversationId, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"
import { getXmtpClientByInboxId } from "../xmtp-client/xmtp-client"

export async function syncOneXmtpConversation(args: {
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

export async function syncAllXmtpConversations(args: {
  clientInboxId: IXmtpInboxId
  consentStates?: ConsentState[]
}) {
  const { clientInboxId, consentStates = ["allowed", "unknown", "denied"] } = args

  try {
    const installationId = await ensureXmtpInstallationQueryData({
      inboxId: clientInboxId,
    })

    const start = new Date().getTime()
    await syncAllConversations(installationId, consentStates)
    const end = new Date().getTime()

    const duration = end - start

    if (duration > config.xmtp.maxMsUntilLogError) {
      captureError(
        new XMTPError({
          error: new Error(
            `Syncing conversations (${consentStates.join(", ")}) from network took ${duration}ms for inbox ${clientInboxId}`,
          ),
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
