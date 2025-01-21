import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm";
import { useQuery } from "@tanstack/react-query";
import { type ConversationTopic } from "@xmtp/react-native-sdk";
import { dmPeerInboxIdQueryKey } from "./QueryKeys";
import { useConversationQuery } from "./useConversationQuery";

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
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
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
    enabled: !!account && !!topic && !!conversation,
  });
};
