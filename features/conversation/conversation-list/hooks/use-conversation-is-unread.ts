import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getConversationMetadataQueryOptions } from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { getConversationQueryOptions } from "@/features/conversation/queries/conversation.query"
import { conversationIsUnreadForInboxId } from "@/features/conversation/utils/conversation-is-unread-by-current-account"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"

type UseConversationIsUnreadArgs = {
  xmtpConversationId: IXmtpConversationId
}

export const useConversationIsUnread = ({ xmtpConversationId }: UseConversationIsUnreadArgs) => {
  const currentSender = useSafeCurrentSender()

  const { data: conversationMetadata, isLoading: isLoadingConversationMetadata } = useQuery(
    getConversationMetadataQueryOptions({
      clientInboxId: currentSender.inboxId,
      xmtpConversationId,
    }),
  )

  const { data: lastMessage, isLoading: isLoadingLastMessage } = useQuery({
    ...getConversationQueryOptions({
      clientInboxId: currentSender.inboxId,
      xmtpConversationId,
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
      consumerInboxId: currentSender.inboxId,
      markedAsUnread: conversationMetadata?.unread ?? false,
      readUntil: conversationMetadata?.readUntil
        ? new Date(conversationMetadata.readUntil).getTime()
        : null,
    })
  }, [lastMessage, conversationMetadata, isLoadingConversationMetadata, currentSender])

  return {
    isUnread,
    isLoading: isLoadingConversationMetadata || isLoadingLastMessage,
  }
}
