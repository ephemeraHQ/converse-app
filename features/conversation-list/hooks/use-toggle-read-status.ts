import { ConversationTopic } from "@xmtp/react-native-sdk"
import { useCallback } from "react"
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { getConversationMetadataQueryData } from "@/features/conversation/conversation-metadata/conversation-metadata.query"
import { useMarkConversationAsRead } from "@/features/conversation/hooks/use-mark-conversation-as-read"
import { useMarkConversationAsUnread } from "@/features/conversation/hooks/use-mark-conversation-as-unread"
import { conversationIsUnreadForInboxId } from "@/features/conversation/utils/conversation-is-unread-by-current-account"
import { getConversationQueryData } from "@/queries/conversation-query"

type UseToggleReadStatusProps = {
  topic: ConversationTopic
}

export const useToggleReadStatus = ({ topic }: UseToggleReadStatusProps) => {
  const { markAsReadAsync } = useMarkConversationAsRead({
    topic,
  })
  const { markAsUnreadAsync } = useMarkConversationAsUnread({
    topic,
  })

  const toggleReadStatusAsync = useCallback(async () => {
    const { ethereumAddress: currentEthereumAddress, inboxId: currentInboxId } =
      getSafeCurrentSender()
    const conversationData = getConversationMetadataQueryData({
      account: currentEthereumAddress,
      topic,
    })
    const conversation = getConversationQueryData({
      account: currentEthereumAddress,
      topic,
    })

    const conversationIsUnread = conversationIsUnreadForInboxId({
      lastMessageSent: conversation?.lastMessage?.sentNs ?? null,
      lastMessageSenderInboxId: conversation?.lastMessage?.senderInboxId ?? null,
      consumerInboxId: currentInboxId,
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
  }, [markAsReadAsync, markAsUnreadAsync, topic])

  return { toggleReadStatusAsync }
}
