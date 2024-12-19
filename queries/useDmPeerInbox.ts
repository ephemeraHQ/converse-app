import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm";
import { useQuery } from "@tanstack/react-query";
import { type ConversationTopic } from "@xmtp/react-native-sdk";
import { useConversationQuery } from "./useConversationQuery";

export const dmPeerInboxIdQueryKey = (
  account: string,
  topic: ConversationTopic
) => ["dmPeerInboxId", account, topic];

export const useDmPeerInboxId = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  const { data: conversation } = useConversationQuery({
    account,
    topic,
  });

  return useQuery({
    queryKey: dmPeerInboxIdQueryKey(account, topic),
    queryFn: () => {
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      if (!isConversationDm(conversation)) {
        throw new Error("Conversation is not a DM");
      }
      return conversation.peerInboxId();
    },
    enabled: !!conversation && isConversationDm(conversation),
  });
};
