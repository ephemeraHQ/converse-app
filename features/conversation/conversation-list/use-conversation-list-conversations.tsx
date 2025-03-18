import { useQueries } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useAllowedConsentConversationsQuery } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { getConversationMetadataQueryOptions } from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { getConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed"

export const useConversationListConversations = () => {
  const currentSender = useSafeCurrentSender()

  const {
    data: conversationIds,
    refetch,
    isLoading: isLoadingConversations,
  } = useAllowedConsentConversationsQuery({
    clientInboxId: currentSender.inboxId,
    caller: "useConversationListConversations",
  })

  const conversationsMetadataQueries = useQueries({
    queries: (conversationIds ?? []).map((conversationId) =>
      getConversationMetadataQueryOptions({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: conversationId,
      }),
    ),
    combine: (queries) => {
      // Extract stable values from queries
      // Get metadata results and conversation data in one pass
      const conversationsWithMetadata = (conversationIds ?? []).map((conversationId, index) => {
        const query = queries[index]
        const conversation = getConversationQueryData({
          clientInboxId: currentSender.inboxId,
          xmtpConversationId: conversationId,
        })

        return {
          conversationId,
          conversation,
          metadata: query.data,
          isLoading: query.isLoading,
        }
      })

      // Filter and sort conversations
      const filteredAndSortedConversations = conversationsWithMetadata
        .filter(({ conversation, metadata, isLoading }) => {
          if (!conversation) {
            return false
          }

          return (
            isConversationAllowed(conversation) &&
            !metadata?.pinned &&
            !metadata?.deleted &&
            !isLoading
          )
        })
        .sort((a, b) => {
          const timestampA = a.conversation?.lastMessage?.sentNs ?? 0
          const timestampB = b.conversation?.lastMessage?.sentNs ?? 0
          return timestampB - timestampA
        })
        .map(({ conversationId }) => conversationId)

      const isLoading = isLoadingConversations || queries.some((query) => query.isLoading)

      return {
        metadataResults: queries.map((query) => ({
          data: query.data,
          isLoading: query.isLoading,
        })),
        filteredAndSortedConversations,
        isLoading,
      }
    },
  })

  return {
    data: conversationsMetadataQueries.filteredAndSortedConversations || [],
    refetch,
    isLoading: conversationsMetadataQueries.isLoading,
  }
}
