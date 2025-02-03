import { getCurrentAccount } from "@/data/store/accountsStore";
import { getConversationQueryData } from "@/queries/conversation-query";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { ConversationTopic, ConversationVersion } from "@xmtp/react-native-sdk";

export function getCurrentAccountConversation(topic: ConversationTopic) {
  const currentAccount = getCurrentAccount()!;
  return getConversationQueryData({
    account: currentAccount,
    topic: topic,
  });
}
// Wether a conversation is blocked

export const isConversationBlocked = (
  conversation: ConversationWithCodecsType
) => {
  if (conversation.version === ConversationVersion.GROUP) {
    // TODO: Check if inboxId is blocked as well
    return conversation.state === "denied";
  } else {
    return conversation.state === "denied";
  }
};
