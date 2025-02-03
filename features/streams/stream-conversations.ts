import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed";
import { isConversationConsentUnknown } from "@/features/conversation/utils/is-conversation-consent-unknown";
import { startMessageStreaming } from "@/features/streams/stream-messages";
import { addConversationToUnknownConsentConversationsQuery } from "@/queries/conversations-unknown-consent-query";
import { addConversationToAllowedConsentConversationsQuery } from "@/queries/conversations-allowed-consent-query";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import {
  stopStreamingConversations,
  streamConversations,
} from "@/utils/xmtpRN/xmtp-conversations/xmtp-conversations-stream";
import logger from "@utils/logger";

export async function startConversationStreaming(account: string) {
  try {
    await streamConversations({
      ethAddress: account,
      onNewConversation: (conversation) =>
        handleNewConversation({ account, conversation }),
    });
  } catch (error) {
    logger.error(error, {
      context: `Failed to stream conversations for ${account}`,
    });
    throw error;
  }
}

export { stopStreamingConversations };

function handleNewConversation(args: {
  account: string;
  conversation: ConversationWithCodecsType;
}) {
  const { account, conversation } = args;

  if (isConversationAllowed(conversation)) {
    addConversationToAllowedConsentConversationsQuery({
      account,
      conversation,
    });

    // This is a temporary workaround related to https://github.com/xmtp/xmtp-react-native/issues/560
    startMessageStreaming({ account });
  } else if (isConversationConsentUnknown(conversation)) {
    addConversationToUnknownConsentConversationsQuery({
      account,
      conversation,
    });
  }
}
