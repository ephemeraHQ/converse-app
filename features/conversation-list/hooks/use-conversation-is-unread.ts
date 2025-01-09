import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useConversationByTopic } from "./use-conversation-by-topic";
import { useConversationIsUnread } from "./useMessageIsUnread";

export const useConversationIsUnreadByTopic = ({
  topic,
}: {
  topic: ConversationTopic;
}) => {
  const conversation = useConversationByTopic(topic);
  return useConversationIsUnread({
    topic,
    lastMessage: conversation?.lastMessage,
    timestampNs: conversation?.lastMessage?.sentNs ?? 0,
  });
};
