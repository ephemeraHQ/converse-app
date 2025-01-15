import { conversationIsUnreadByTimestamp } from "@/features/conversation/utils/conversation-is-unread-by-current-account";
import { getConversationDataQueryOptions } from "@/queries/conversation-data-query";
import { getConversationQueryOptions } from "@/queries/useConversationQuery";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useQuery } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { useMemo } from "react";

type UseConversationIsUnreadArgs = {
  topic: ConversationTopic;
};

export const useConversationIsUnread = ({
  topic,
}: UseConversationIsUnreadArgs) => {
  const currentAccount = useCurrentAccount();
  // const { data: currentUserInboxId } = useCurrentAccountInboxId();

  const { data: conversationData, isLoading: isLoadingConversationData } =
    useQuery(
      getConversationDataQueryOptions({
        account: currentAccount!,
        topic,
        context: "useConversationIsUnread",
      })
    );

  const { data: lastMessage, isLoading: isLoadingLastMessage } = useQuery({
    ...getConversationQueryOptions({
      account: currentAccount!,
      topic,
      context: "useConversationIsUnread",
    }),
    select: (data) => data?.lastMessage,
  });

  const isUnread = useMemo(() => {
    // User intentionally marked as unread
    if (conversationData?.markedAsUnread) {
      return true;
    }

    if (!lastMessage) {
      return false;
    }

    // If the last message is from the current user, it's not unread
    // Not sure... UX Feels weird
    // if (lastMessage.senderInboxId === currentUserInboxId) {
    //   return false;
    // }

    return conversationIsUnreadByTimestamp({
      lastMessageSent: lastMessage.sentNs,
      readUntil: conversationData?.readUntil ?? 0,
    });
  }, [
    lastMessage,
    conversationData?.readUntil,
    conversationData?.markedAsUnread,
    // currentUserInboxId,
  ]);

  return {
    isUnread,
    isLoading: isLoadingConversationData || isLoadingLastMessage,
  };
};
