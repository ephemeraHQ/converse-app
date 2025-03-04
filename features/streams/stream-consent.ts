import { logger } from "@utils/logger"
import {
  stopStreamingConsent,
  streamConsent,
} from "@/features/xmtp/xmtp-preferences/xmtp-preferences-stream"

export async function startConsentStreaming(account: string) {
  try {
    await streamConsent(account)
  } catch (error) {
    logger.error(error, {
      context: `Failed to stream consent for ${account}`,
    })
    throw error
  }
}

export { stopStreamingConsent }
