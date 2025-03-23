import {
  stopStreamingConsent,
  streamXmtpConsent,
} from "@/features/xmtp/xmtp-preferences/xmtp-preferences-stream"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { StreamError } from "@/utils/error"

export async function startConsentStreaming(args: { inboxId: IXmtpInboxId }) {
  const { inboxId } = args

  try {
    await streamXmtpConsent({ inboxId })
  } catch (error) {
    throw new StreamError({
      error,
      additionalMessage: `Failed to stream consent for ${inboxId}`,
    })
  }
}

export { stopStreamingConsent }
