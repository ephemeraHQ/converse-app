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

  useEffect(() => {
    if (conversations) {
      // Let's prefetch the messages for all the conversations
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

  const conversationsDataQueries = useQueries({
    queries: (conversations ?? []).map((conversation) =>
      getConversationMetadataQueryOptions({
        account: currentAccount!,
        topic: conversation.topic,
      })
    ),
  });

  const conversationsFiltered = useMemo(() => {
    if (!conversations) return [];

    return conversations.filter((conversation, index) => {
      const query = conversationsDataQueries[index];
      return (
        // Check if conversation is allowed based on permissions
        isConversationAllowed(conversation) &&
        // Exclude pinned conversations
        !query?.data?.isPinned &&
        // Exclude deleted conversations
        !query?.data?.isDeleted &&
        // Only include conversations that have finished loading
        !query?.isLoading
      );
    });
  }, [conversations, conversationsDataQueries]);

  return { data: conversationsFiltered, ...rest };
};
