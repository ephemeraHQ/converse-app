import { xmtpLogger } from "@utils/logger";
import { IXmtpConversationWithCodecs } from "@/features/xmtp/xmtp.types";
import { getXmtpClientByEthAddress } from "../xmtp-client/xmtp-client.service";

export async function streamConversations(args: {
  ethAddress: string;
  onNewConversation: (
    conversation: IXmtpConversationWithCodecs,
  ) => void | Promise<void>;
}) {
  const { ethAddress, onNewConversation } = args;

  const client = await getXmtpClientByEthAddress({
    ethereumAddress: ethAddress,
  });

  xmtpLogger.debug(
    `Started streaming conversations for account: ${ethAddress}`,
  );

  await client.conversations.stream(async (conversation) => {
    xmtpLogger.debug(`Received new conversation for account: ${ethAddress}`);
    onNewConversation(conversation);
  });
}

export async function stopStreamingConversations(args: { ethAddress: string }) {
  const { ethAddress } = args;

  const client = await getXmtpClientByEthAddress({
    ethereumAddress: ethAddress,
  });

  await client.conversations.cancelStream();

  xmtpLogger.debug(
    `Stopped streaming conversations for account: ${ethAddress}`,
  );
}
