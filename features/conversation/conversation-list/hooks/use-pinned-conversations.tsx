import { useQueries } from "@tanstack/react-query"
import { useMemo } from "react"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useAllowedConsentConversationsQuery } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { getConversationMetadataQueryOptions } from "@/features/conversation/conversation-metadata/conversation-metadata.query"

export function usePinnedConversations() {
  const currentSender = useSafeCurrentSender()

  const { isLoading: isLoadingConversations, data: conversations } =
    useAllowedConsentConversationsQuery({
      clientInboxId: currentSender.inboxId,
      caller: "usePinnedConversations",
    })

  const conversationsDataQueries = useQueries({
    queries: (conversations ?? []).map((conversation) =>
      getConversationMetadataQueryOptions({
        clientInboxId: currentSender.inboxId,
        topic: conversation.topic,
      }),
    ),
  })

  const pinnedConversations = useMemo(() => {
    return conversations?.filter((conversation, index) => {
      const query = conversationsDataQueries[index]
      return query?.data?.pinned
    })
  }, [conversations, conversationsDataQueries])

  return {
    pinnedConversations,
    isLoading: isLoadingConversations || conversationsDataQueries.some((q) => q.isLoading),
  }
}
