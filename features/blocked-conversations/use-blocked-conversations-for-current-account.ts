import { useQueries } from "@tanstack/react-query"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useAllowedConsentConversationsQuery } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { getConversationMetadataQueryOptions } from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { getConversationQueryOptions } from "@/features/conversation/queries/conversation.query"
import { isConversationDenied } from "@/features/conversation/utils/is-conversation-denied"

export const useBlockedConversationsForCurrentAccount = () => {
  const currentSender = useSafeCurrentSender()

  const { data: conversationIds } = useAllowedConsentConversationsQuery({
    clientInboxId: currentSender.inboxId,
    caller: "useBlockedConversationsForCurrentAccount",
  })

  // Create an array of metadata query configs and conversation query configs
  const metadataQueries = useQueries({
    queries: (conversationIds ?? []).map((conversationId) => ({
      ...getConversationMetadataQueryOptions({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: conversationId,
      }),
    })),
  })

  const conversationQueries = useQueries({
    queries: (conversationIds ?? []).map((conversationId) => ({
      ...getConversationQueryOptions({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: conversationId,
        caller: "useBlockedConversationsForCurrentAccount",
      }),
    })),
  })

  // Find blocked conversations by comparing both query results
  const blockedConversationIds = (conversationIds ?? []).filter((conversationId, index) => {
    const metadataQuery = metadataQueries[index]
    const conversationQuery = conversationQueries[index]

    return (
      metadataQuery.data?.deleted ||
      (conversationQuery.data && isConversationDenied(conversationQuery.data))
    )
  })

  return {
    data: blockedConversationIds,
  }
}
