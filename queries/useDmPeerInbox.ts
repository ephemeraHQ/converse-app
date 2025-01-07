import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm";
import { useQuery } from "@tanstack/react-query";
import { type ConversationTopic } from "@xmtp/react-native-sdk";
import { useConversationQuery } from "./useConversationQuery";
import { useCurrentInboxId } from "@/data/store/accountsStore";

export const dmPeerInboxIdQueryKey = (
  currentInboxId: string | undefined,
  topic: ConversationTopic
) => ["dmPeerInboxId", currentInboxId, topic];

export const useDmPeerInboxId = (args: { topic: ConversationTopic }) => {
  const { topic } = args;
  const currentInboxId = useCurrentInboxId();
  const { data: conversation } = useConversationQuery({
    inboxId: currentInboxId,
    topic,
  });

  return useQuery({
    queryKey: dmPeerInboxIdQueryKey(currentInboxId, topic),
    queryFn: () => {
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      if (!isConversationDm(conversation)) {
        throw new Error("Conversation is not a DM");
      }
      return conversation.peerInboxId();
    },
    enabled:
      !!currentInboxId && !!conversation && isConversationDm(conversation),
  });
};
