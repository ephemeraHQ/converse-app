import { isConversationDm } from "@/features/conversation/utils/is-conversation-dm";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { type ConversationTopic } from "@xmtp/react-native-sdk";
import { getConversationQueryData } from "./useConversationQuery";

export const dmPeerInboxIdQueryKey = (
  account: string,
  topic: ConversationTopic
) => ["dmPeerInboxId", account, topic];

const getDmPeerInboxIdQueryOptions = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  return queryOptions({
    queryKey: dmPeerInboxIdQueryKey(account, topic),
    queryFn: () => {
      const conversation = getConversationQueryData({
        account,
        topic,
        context: "useDmPeerInboxId",
      });
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      if (!isConversationDm(conversation)) {
        throw new Error("Conversation is not a DM");
      }
      return conversation.peerInboxId();
    },
    enabled: !!account && !!topic,
  });
};

export const useDmPeerInboxId = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;

  return useQuery(getDmPeerInboxIdQueryOptions({ account, topic }));
};
