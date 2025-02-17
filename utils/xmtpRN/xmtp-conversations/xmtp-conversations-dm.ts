import { XMTPError } from "@/utils/error";
import logger from "@/utils/logger";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { InboxId } from "@xmtp/react-native-sdk";

export async function getXmtpDmByInboxId(args: {
  ethAccountAddress: string;
  inboxId: InboxId;
}) {
  const { ethAccountAddress, inboxId } = args;
  const startTime = Date.now();

  try {
    const client = MultiInboxClient.instance.getInboxClientForAddress({
      ethereumAddress: ethAccountAddress,
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

export async function createXmtpDm(args: {
  senderEthAddress: string;
  peerInboxId: InboxId;
}) {
  const { senderEthAddress, peerInboxId } = args;
  try {
    const client = MultiInboxClient.instance.getInboxClientForAddress({
      ethereumAddress: senderEthAddress,
    });

    const startTime = Date.now();

    const conversation = await client.conversations.findOrCreateDmWithInboxId(
      peerInboxId
    );

    const duration = Date.now() - startTime;

    if (duration > 3000) {
      logger.warn(
        `[createXmtpDm] Took ${duration}ms to create DM with inboxId: ${peerInboxId}`
      );
    }

    return conversation;
  } catch (error) {
    throw new XMTPError("Failed to create XMTP DM", {
      cause: error,
    });
  }
}
