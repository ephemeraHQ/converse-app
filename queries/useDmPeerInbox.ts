import { useQuery } from "@tanstack/react-query";
import { getDmPeerInbox } from "@utils/xmtpRN/contacts";
import {
  ConversationVersion,
  type ConversationTopic,
} from "@xmtp/react-native-sdk";
import { useConversationQuery } from "./useConversationQuery";

export const dmPeerInboxIdQueryKey = (
  account: string,
  topic: ConversationTopic
) => ["dmPeerInboxId", account, topic];

export const useDmPeerInboxId = (account: string, topic: ConversationTopic) => {
  const { data: conversation } = useConversationQuery(account, topic);
  return useQuery({
    queryKey: dmPeerInboxIdQueryKey(account, topic),
    queryFn: () => {
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      if (conversation.version !== ConversationVersion.DM) {
        throw new Error("Conversation is not a DM");
      }
      return getDmPeerInbox(conversation);
    },
    enabled: !!conversation && conversation.version === ConversationVersion.DM,
  });
};
