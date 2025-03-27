import { useQueries } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useAllowedConsentConversationsQuery } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { getConversationMetadataQueryOptions } from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { getConversationQueryData } from "@/features/conversation/queries/conversation.query"
import { isConversationAllowed } from "@/features/conversation/utils/is-conversation-allowed"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"

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
      // Process everything in a single reduce operation for efficiency
      const filteredAndSortedConversations = (conversationIds ?? []).reduce(
        (validConversations, conversationId, index) => {
          const metadataQuery = queries[index]
          const conversation = getConversationQueryData({
            clientInboxId: currentSender.inboxId,
            xmtpConversationId: conversationId,
          })
          const metadata = metadataQuery.data

          // If Metadata have failed we don't really care and still want to show the conversations.
          // We only care if we HAVEN'T even tried to fetch the metadata yet.
          const isMetadataLoading =
            metadataQuery.isLoading && !metadataQuery.data && !metadataQuery.isFetched

          // Check if this conversation passes all our filters
          if (
            conversation &&
            isConversationAllowed(conversation) &&
            !metadata?.pinned &&
            !metadata?.deleted &&
            !isMetadataLoading
          ) {
            // Add to valid conversations with its timestamp for sorting
            validConversations.push({
              conversationId,
              timestamp: conversation.lastMessage?.sentNs ?? 0,
            })
          }

          return validConversations
        },
        [] as Array<{ conversationId: IXmtpConversationId; timestamp: number }>,
      )

      // Sort by timestamp (newest first)
      filteredAndSortedConversations.sort((a, b) => b.timestamp - a.timestamp)

      // Extract just the IDs for the final result
      const sortedIds = filteredAndSortedConversations.map((item) => item.conversationId)

      // Only consider it loading if:
      // 1. We're loading conversation IDs for the first time, OR
      // 2. Any metadata query is truly loading (no existing data)
      const hasAnyMetadataLoading = queries.some((query) => query.isLoading && !query.data)
      const isLoading = isLoadingConversations || hasAnyMetadataLoading

      return {
        filteredAndSortedConversations: sortedIds,
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
