import {
  stopStreamingConsent,
  streamConsent,
} from "@/utils/xmtpRN/xmtp-preferences/xmtp-preferences-stream";
import logger from "@utils/logger";

export async function startConsentStreaming(account: string) {
  try {
    await streamConsent(account);
  } catch (error) {
    logger.error(error, {
      context: `Failed to stream consent for ${account}`,
    });
    throw error;
  }
}

export { stopStreamingConsent };
