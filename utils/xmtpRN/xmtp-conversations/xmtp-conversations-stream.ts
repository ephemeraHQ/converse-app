import { ConversationWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { logger } from "@utils/logger";
import { getXmtpClient } from "../xmtp-client/xmtp-client";

export async function streamConversations(args: {
  ethAddress: string;
  onNewConversation: (
    conversation: ConversationWithCodecsType
  ) => void | Promise<void>;
}) {
  const { ethAddress, onNewConversation } = args;

  // Stop before restarting just to be sure
  await stopStreamingConversations({ ethAddress });

  const client = await getXmtpClient({
    address: ethAddress,
  });

  logger.debug(
    `[XMTP - streamConversations] Started streaming conversations for account: ${ethAddress}`
  );

  await client.conversations.stream(async (conversation) => {
    logger.debug(
      `[XMTP - streamConversations] Received new conversation for account: ${ethAddress}`
    );
    onNewConversation(conversation);
  });
}

export async function stopStreamingConversations(args: { ethAddress: string }) {
  const { ethAddress } = args;
  const client = await getXmtpClient({
    address: ethAddress,
  });
  return client.conversations.cancelStream();
}
