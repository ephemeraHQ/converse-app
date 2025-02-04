import { XMTPError } from "@/utils/error";
import logger from "@/utils/logger";
import { getXmtpClient } from "@/utils/xmtpRN/xmtp-client/xmtp-client";
import { InboxId } from "@xmtp/react-native-sdk";

export async function getDmByInboxId(args: {
  ethAccountAddress: string;
  inboxId: InboxId;
}) {
  const { ethAccountAddress, inboxId } = args;
  const startTime = Date.now();

  try {
    const client = await getXmtpClient({
      address: ethAccountAddress,
      inboxId,
    });

    const conversation = await client.conversations.findDmByInboxId(inboxId);

    const duration = Date.now() - startTime;

    if (duration > 3000) {
      logger.warn(
        `[getConversationByInboxId] Took ${duration}ms to get conversation by inboxId: ${inboxId}`
      );
    }

    return conversation;
  } catch (error) {
    throw new XMTPError("Failed to get conversation by inbox ID", {
      cause: error,
    });
  }
}
