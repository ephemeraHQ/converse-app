import { useQuery } from "@tanstack/react-query"
import { ConversationTopic } from "@xmtp/react-native-sdk"
import { useMemo } from "react"
import {
  useCurrentSenderEthAddress,
  useSafeCurrentSender,
} from "@/features/authentication/multi-inbox.store"
import { getConversationMetadataQueryOptions } from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { getConversationQueryOptions } from "@/features/conversation/conversation-query"
import { conversationIsUnreadForInboxId } from "@/features/conversation/utils/conversation-is-unread-by-current-account"

type UseConversationIsUnreadArgs = {
  topic: ConversationTopic
}

export const useConversationIsUnread = ({ topic }: UseConversationIsUnreadArgs) => {
  const currentAccount = useCurrentSenderEthAddress()
  const currentUserInboxId = useSafeCurrentSender().inboxId

  const { data: conversationMetadata, isLoading: isLoadingConversationMetadata } = useQuery(
    getConversationMetadataQueryOptions({
      account: currentAccount!,
      topic,
    }),
  )

  const { data: lastMessage, isLoading: isLoadingLastMessage } = useQuery({
    ...getConversationQueryOptions({
      account: currentAccount!,
      topic,
    }),
    select: (data) => data?.lastMessage,
  })

  const isUnread = useMemo(() => {
    // By default we consider the conversation read if we haven't loaded the conversation metadata
    if (isLoadingConversationMetadata) {
      return false
    }

    // For now, if we don't have conversation metadata, we consider the conversation read because we don't want to be dependent on the BE
    if (!conversationMetadata) {
      return false
    }

    return conversationIsUnreadForInboxId({
      lastMessageSent: lastMessage?.sentNs ?? null,
      lastMessageSenderInboxId: lastMessage?.senderInboxId ?? null,
      consumerInboxId: currentUserInboxId!,
      markedAsUnread: conversationMetadata?.unread ?? false,
      readUntil: conversationMetadata?.readUntil
        ? new Date(conversationMetadata.readUntil).getTime()
        : null,
    })
  }, [lastMessage, conversationMetadata, isLoadingConversationMetadata, currentUserInboxId])

  return {
    isUnread,
    isLoading: isLoadingConversationMetadata || isLoadingLastMessage,
  }
}
