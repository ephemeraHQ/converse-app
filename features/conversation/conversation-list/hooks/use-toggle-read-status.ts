import { useCallback } from "react"
import {
  getSafeCurrentSender,
  useSafeCurrentSender,
} from "@/features/authentication/multi-inbox.store"
import { getConversationMetadataQueryData } from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { useMarkConversationAsRead } from "@/features/conversation/hooks/use-mark-conversation-as-read"
import { useMarkConversationAsUnread } from "@/features/conversation/hooks/use-mark-conversation-as-unread"
import { useConversationQuery } from "@/features/conversation/queries/conversation.query"
import { conversationIsUnreadForInboxId } from "@/features/conversation/utils/conversation-is-unread-by-current-account"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"

type UseToggleReadStatusProps = {
  xmtpConversationId: IXmtpConversationId
}

export const useToggleReadStatus = ({ xmtpConversationId }: UseToggleReadStatusProps) => {
  const { markAsReadAsync } = useMarkConversationAsRead({
    xmtpConversationId,
  })
  const { markAsUnreadAsync } = useMarkConversationAsUnread({
    xmtpConversationId,
  })

  const currentSender = useSafeCurrentSender()

  const { data: conversation } = useConversationQuery({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
    caller: "useToggleReadStatus",
  })

  const toggleReadStatusAsync = useCallback(async () => {
    const currentSender = getSafeCurrentSender()

    if (!conversation) {
      throw new Error("Conversation not found")
    }

    const conversationData = getConversationMetadataQueryData({
      clientInboxId: currentSender.inboxId,
      xmtpConversationId,
    })

    const conversationIsUnread = conversationIsUnreadForInboxId({
      lastMessageSent: conversation?.lastMessage?.sentNs ?? null,
      lastMessageSenderInboxId: conversation?.lastMessage?.senderInboxId ?? null,
      consumerInboxId: currentSender.inboxId,
      readUntil: conversationData?.readUntil
        ? new Date(conversationData.readUntil).getTime()
        : null,
      markedAsUnread: conversationData?.unread ?? false,
    })

    if (conversationIsUnread) {
      await markAsReadAsync()
    } else {
      await markAsUnreadAsync()
    }
  }, [markAsReadAsync, markAsUnreadAsync, xmtpConversationId, conversation])

  return { toggleReadStatusAsync }
}
