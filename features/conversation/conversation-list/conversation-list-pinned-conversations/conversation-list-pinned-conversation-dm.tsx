import { useCallback } from "react"
import { Avatar } from "@/components/avatar"
import { VStack } from "@/design-system/VStack"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { useConversationListPinnedConversationsStyles } from "@/features/conversation/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversations.styles"
import { useConversationIsUnread } from "@/features/conversation/conversation-list/hooks/use-conversation-is-unread"
import { useDmConversationContextMenuViewProps } from "@/features/conversation/conversation-list/hooks/use-conversation-list-item-context-menu-props"
import { useDmQuery } from "@/features/dm/dm.query"
import { IDm } from "@/features/dm/dm.types"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { navigate } from "@/navigation/navigation.utils"
import { captureError } from "@/utils/capture-error"
import { isTextMessage } from "../../conversation-chat/conversation-message/utils/conversation-message-assertions"
import { ConversationListPinnedConversation } from "./conversation-list-pinned-conversation"
import { PinnedConversationMessagePreview } from "./conversation-list-pinned-conversation-message-preview"

type IConversationListPinnedConversationDmProps = {
  conversation: IDm
}

export const ConversationListPinnedConversationDm = ({
  conversation,
}: IConversationListPinnedConversationDmProps) => {
  const currentSender = useSafeCurrentSender()
  const xmtpConversationId = conversation.xmtpId
  const { avatarSize } = useConversationListPinnedConversationsStyles()

  const { data: dm } = useDmQuery({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })

  const { displayName, avatarUrl } = usePreferredDisplayInfo({
    inboxId: dm?.peerInboxId,
  })

  const { isUnread } = useConversationIsUnread({
    xmtpConversationId,
  })

  const onPress = useCallback(() => {
    navigate("Conversation", { xmtpConversationId }).catch(captureError)
  }, [xmtpConversationId])

  const displayMessagePreview =
    conversation.lastMessage && isTextMessage(conversation.lastMessage) && isUnread

  const contextMenuProps = useDmConversationContextMenuViewProps({
    xmtpConversationId,
  })

  return (
    <VStack>
      <ConversationListPinnedConversation
        avatarComponent={
          <Avatar sizeNumber={avatarSize} uri={avatarUrl} name={displayName ?? ""} />
        }
        onPress={onPress}
        showUnread={isUnread}
        title={displayName ?? ""}
        contextMenuProps={contextMenuProps}
      />
      {displayMessagePreview && (
        <PinnedConversationMessagePreview message={conversation.lastMessage!} />
      )}
    </VStack>
  )
}
