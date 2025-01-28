import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed";
import { isConversationConsentUnknown } from "@/features/conversation/utils/is-conversation-consent-unknown";
import { addConversationToUnknownConsentConversationsQuery } from "@/queries/unknown-consent-conversations-query";
import { addConversationToConversationsQuery } from "@/queries/use-conversations-query";
import logger from "@utils/logger";
import { ConverseXmtpClientType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { getXmtpClient } from "../xmtp-client/xmtp-client";

export const streamConversations = async (account: string) => {
  await stopStreamingConversations(account);
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  await client.conversations.stream(async (conversation) => {
    logger.info("[XMTPRN Conversations] GOT A NEW CONVO");
    if (isConversationAllowed(conversation)) {
      addConversationToConversationsQuery({
        account,
        conversation,
      });
    } else if (isConversationConsentUnknown(conversation)) {
      addConversationToUnknownConsentConversationsQuery({
        account,
        conversation,
      });
    }
  });
  logger.info("STREAMING CONVOS");
};

export const stopStreamingConversations = async (account: string) => {
  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;
  return client.conversations.cancelStream();
};
