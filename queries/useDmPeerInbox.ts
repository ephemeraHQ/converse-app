import {
  ConversationVersion,
  type ConversationTopic,
} from "@xmtp/react-native-sdk";
import { useConversationScreenQuery } from "./useConversationQuery";
import { useQuery } from "@tanstack/react-query";
import { getDmPeerInbox } from "@utils/xmtpRN/contacts";

export const dmPeerInboxQueryKey = (
  account: string,
  topic: ConversationTopic
) => ["dmPeerInbox", account, topic];

export const useDmPeerInbox = (account: string, topic: ConversationTopic) => {
  const { data: conversation } = useConversationScreenQuery(account, topic);
  return useQuery({
    queryKey: dmPeerInboxQueryKey(account, topic),
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
