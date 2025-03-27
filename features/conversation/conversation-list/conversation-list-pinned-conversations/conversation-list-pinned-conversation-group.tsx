import { useCallback } from "react"
import { GroupAvatar } from "@/components/group-avatar"
import { VStack } from "@/design-system/VStack"
import { isTextMessage } from "@/features/conversation/conversation-chat/conversation-message/utils/conversation-message-assertions"
import { useConversationListPinnedConversationsStyles } from "@/features/conversation/conversation-list/conversation-list-pinned-conversations/conversation-list-pinned-conversations.styles"
import { useConversationIsUnread } from "@/features/conversation/conversation-list/hooks/use-conversation-is-unread"
import { useGroupConversationContextMenuViewProps } from "@/features/conversation/conversation-list/hooks/use-conversation-list-item-context-menu-props"
import { IGroup } from "@/features/groups/group.types"
import { useGroupName } from "@/features/groups/hooks/use-group-name"
import { navigate } from "@/navigation/navigation.utils"
import { captureError } from "@/utils/capture-error"
import { ConversationListPinnedConversation } from "./conversation-list-pinned-conversation"
import { PinnedConversationMessagePreview } from "./conversation-list-pinned-conversation-message-preview"

type IConversationListPinnedConversationGroupProps = {
  group: IGroup
}

export const ConversationListPinnedConversationGroup = ({
  group,
}: IConversationListPinnedConversationGroupProps) => {
  const groupConversationTopic = group.xmtpId

  const { avatarSize } = useConversationListPinnedConversationsStyles()

  const { isUnread } = useConversationIsUnread({
    xmtpConversationId: groupConversationTopic,
  })

  const onPress = useCallback(() => {
    navigate("Conversation", { xmtpConversationId: group.xmtpId }).catch(captureError)
  }, [group.xmtpId])

  const { groupName } = useGroupName({
    xmtpConversationId: groupConversationTopic,
  })

  const displayMessagePreview = group.lastMessage && isTextMessage(group.lastMessage) && isUnread

  const contextMenuProps = useGroupConversationContextMenuViewProps({
    xmtpConversationId: groupConversationTopic,
  })

  return (
    <VStack>
      <ConversationListPinnedConversation
        contextMenuProps={contextMenuProps}
        avatarComponent={
          <GroupAvatar xmtpConversationId={groupConversationTopic} sizeNumber={avatarSize} />
        }
        onPress={onPress}
        showUnread={isUnread}
        title={groupName ?? ""}
      />
      {displayMessagePreview && <PinnedConversationMessagePreview message={group.lastMessage!} />}
    </VStack>
  )
}
