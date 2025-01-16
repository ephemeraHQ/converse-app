import { conversationIsUnreadByTimestamp } from "@/features/conversation/utils/conversation-is-unread-by-current-account";
import { useCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { getConversationMetadataQueryOptions } from "@/queries/conversation-metadata-query";
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
  const { data: currentUserInboxId } = useCurrentAccountInboxId();

  const {
    data: conversationMetadata,
    isLoading: isLoadingConversationMetadata,
  } = useQuery(
    getConversationMetadataQueryOptions({
      account: currentAccount!,
      topic,
    })
  );

  const { data: lastMessage, isLoading: isLoadingLastMessage } = useQuery({
    ...getConversationQueryOptions({
      account: currentAccount!,
      topic,
    }),
    select: (data) => data?.lastMessage,
  });

  const isUnread = useMemo(() => {
    // By default we consider the conversation read if we haven't loaded the conversation metadata
    if (isLoadingConversationMetadata) {
      return false;
    }

    // User intentionally marked as unread
    if (conversationMetadata?.markedAsUnread) {
      return true;
    }

    // If the last message is from the current user, it's not unread... unless they marked the convo as unread but it's handled above
    if (lastMessage?.senderInboxId === currentUserInboxId) {
      return false;
    }

    if (!lastMessage) {
      return false;
    }

    return conversationIsUnreadByTimestamp({
      lastMessageSent: lastMessage.sentNs,
      readUntil: conversationMetadata?.readUntil ?? 0,
    });
  }, [
    lastMessage,
    conversationMetadata,
    isLoadingConversationMetadata,
    currentUserInboxId,
  ]);

  return {
    isUnread,
    isLoading: isLoadingConversationMetadata || isLoadingLastMessage,
  };
};
