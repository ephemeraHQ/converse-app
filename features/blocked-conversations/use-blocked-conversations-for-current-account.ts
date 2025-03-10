import { useQueries } from "@tanstack/react-query"
import { useMemo } from "react"
import { useCurrentSenderEthAddress } from "@/features/authentication/multi-inbox.store"
import { useAllowedConsentConversationsQuery } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import { getConversationMetadataQueryOptions } from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { isConversationDenied } from "@/features/conversation/utils/is-conversation-denied"

export const useBlockedConversationsForCurrentAccount = () => {
  const currentAccount = useCurrentSenderEthAddress()

  const { data } = useAllowedConsentConversationsQuery({
    account: currentAccount!,
    caller: "useBlockedConversationsForCurrentAccount",
  })

  const conversationsMetadataQueries = useQueries({
    queries: (data ?? []).map((conversation) =>
      getConversationMetadataQueryOptions({
        account: currentAccount!,
        topic: conversation.topic,
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
