import { useCurrentAccount } from "@/data/store/accountsStore";
import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed";
import { useScreenFocusEffectOnce } from "@/hooks/use-screen-focus-effect-once";
import { useAppStateHandlers } from "@/hooks/useAppStateHandlers";
import { getConversationMetadataQueryOptions } from "@/queries/conversation-metadata-query";
import { getConversationsQueryOptions } from "@/queries/conversations-query";
import { prefetchConversationMessages } from "@/queries/use-conversation-messages-query";
import { captureError } from "@/utils/capture-error";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

export const useConversationListConversations = () => {
  const currentAccount = useCurrentAccount();

  const { data: conversations, ...rest } = useQuery(
    getConversationsQueryOptions({
      account: currentAccount!,
    })
  );

  // Let's prefetch the messages for all the conversations
  useEffect(() => {
    if (conversations) {
      for (const conversation of conversations) {
        prefetchConversationMessages({
          account: currentAccount!,
          topic: conversation.topic,
        }).catch(captureError);
      }
    }
  }, [conversations, currentAccount]);

  // For now, let's make sure we always are up to date with the conversations
  useScreenFocusEffectOnce(() => {
    rest.refetch().catch(captureError);
  });

  // For now, let's make sure we always are up to date with the conversations
  useAppStateHandlers({
    onForeground: () => {
      rest.refetch().catch(captureError);
    },
  });

  const conversationsMetadataQueries = useQueries({
    queries: (conversations ?? []).map((conversation) =>
      getConversationMetadataQueryOptions({
        account: currentAccount!,
        topic: conversation.topic,
      })
    ),
  });

  const filteredAndSortedConversations = useMemo(() => {
    if (!conversations) return [];

    // Filter out conversations that don't meet criteria
    const filtered = conversations.filter((conversation, index) => {
      const query = conversationsMetadataQueries[index];
      return (
        isConversationAllowed(conversation) &&
        !query?.data?.isPinned &&
        !query?.data?.isDeleted &&
        !query?.isLoading
      );
    });

    // Sort by timestamp descending (newest first)
    return filtered.sort((a, b) => {
      const timestampA = a.lastMessage?.sentNs ?? 0;
      const timestampB = b.lastMessage?.sentNs ?? 0;
      return timestampB - timestampA;
    });
  }, [conversations, conversationsMetadataQueries]);

  return { data: filteredAndSortedConversations, ...rest };
};
