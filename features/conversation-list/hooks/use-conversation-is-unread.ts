import { conversationIsUnread } from "@/features/conversation/utils/conversation-is-unread-by-current-account";
import { getCurrentUserAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { getConversationDataQueryOptions } from "@/queries/use-conversation-data-query";
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

  const { data: readUntil, isLoading } = useQuery({
    ...getConversationDataQueryOptions({
      account: currentAccount!,
      topic,
    }),
    select: (data) => data?.readUntil,
  });

  const currentInboxId = getCurrentUserAccountInboxId();

  const { data: lastMessage } = useQuery({
    ...getConversationQueryOptions({
      account: currentAccount!,
      topic,
    }),
    select: (data) => data?.lastMessage,
  });

  return useMemo(() => {
    if (!lastMessage) {
      return { isUnread: false, isLoading };
    }

    if (lastMessage.senderInboxId === currentInboxId) {
      return { isUnread: false, isLoading };
    }

    return {
      isUnread: conversationIsUnread({
        lastMessageSent: lastMessage.sentNs,
        readUntil: readUntil ?? 0,
      }),
      isLoading,
    };
  }, [lastMessage, currentInboxId, isLoading, readUntil]);
};
