import { ConsentState, syncAllConversations } from "@xmtp/react-native-sdk"
import { config } from "@/config"
import { ensureXmtpInstallationQueryData } from "@/features/xmtp/xmtp-installations/xmtp-installation.query"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"

export async function syncAllXmtpConversations(args: {
  clientInboxId: IXmtpInboxId
  consentStates: ConsentState[]
}) {
  const { clientInboxId, consentStates } = args

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
