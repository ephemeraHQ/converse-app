import { logger } from "@utils/logger"
import {
  stopStreamingConsent,
  streamXmtpConsent,
} from "@/features/xmtp/xmtp-preferences/xmtp-preferences-stream"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"

export async function startConsentStreaming(args: { inboxId: IXmtpInboxId }) {
  const { inboxId } = args

  try {
    await streamXmtpConsent({ inboxId })
  } catch (error) {
    logger.error(error, {
      context: `Failed to stream consent for ${inboxId}`,
    })
    throw error
  }
}

export { stopStreamingConsent }
