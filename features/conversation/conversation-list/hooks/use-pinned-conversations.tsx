import { useQueries } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useAllowedConsentConversationsQuery } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { getConversationMetadataQueryOptions } from "@/features/conversation/conversation-metadata/conversation-metadata.query"

export function usePinnedConversations() {
  const currentSender = useSafeCurrentSender()

  const { isLoading: isLoadingConversations, data: conversationIds } =
    useAllowedConsentConversationsQuery({
      clientInboxId: currentSender.inboxId,
      caller: "usePinnedConversations",
    })

  const conversationsMetadataQueries = useQueries({
    queries: (conversationIds ?? []).map((conversationId) =>
      getConversationMetadataQueryOptions({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: conversationId,
      }),
    ),
    combine: (queries) => {
      // Filter to just pinned conversations
      const pinnedConversationsIds = (conversationIds ?? []).filter((_, index) => {
        const query = queries[index]
        return query.data?.pinned && !query.isLoading
      })

      const isLoading = isLoadingConversations || queries.some((query) => query.isLoading)

      return {
        pinnedConversationsIds,
        isLoading,
      }
    },
  })

  return {
    pinnedConversationsIds: conversationsMetadataQueries.pinnedConversationsIds || [],
    isLoading: conversationsMetadataQueries.isLoading,
  }
}
