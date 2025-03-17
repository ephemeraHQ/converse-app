import { useQueries } from "@tanstack/react-query"
import { useMemo } from "react"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useAllowedConsentConversationsQuery } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { getConversationMetadataQueryOptions } from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { isConversationDenied } from "@/features/conversation/utils/is-conversation-denied"

export const useBlockedConversationsForCurrentAccount = () => {
  const currentSender = useSafeCurrentSender()

  const { data } = useAllowedConsentConversationsQuery({
    clientInboxId: currentSender.inboxId,
    caller: "useBlockedConversationsForCurrentAccount",
  })

  const conversationsMetadataQueries = useQueries({
    queries: (data ?? []).map((conversation) =>
      getConversationMetadataQueryOptions({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: conversation.xmtpId,
      }),
    ),
  })

  const blockedConversations = useMemo(() => {
    if (!data) return []

    return data.filter((conversation, index) => {
      const query = conversationsMetadataQueries[index]
      return (
        // Include deleted conversations
        query?.data?.deleted ||
        // Include denied conversations
        isConversationDenied(conversation)
      )
    })
  }, [data, conversationsMetadataQueries])

  return { data: blockedConversations }
}
