import { getCompactRelativeTime } from "@utils/date"
import { memo, useCallback } from "react"
import { GroupAvatar } from "@/components/group-avatar"
import { ISwipeableRenderActionsArgs } from "@/components/swipeable"
import { MIDDLE_DOT } from "@/design-system/middle-dot"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { ConversationListItemSwipeable } from "@/features/conversation/conversation-list/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable"
import { useConversationIsUnread } from "@/features/conversation/conversation-list/hooks/use-conversation-is-unread"
import { useDeleteGroup } from "@/features/conversation/conversation-list/hooks/use-delete-group"
import { useMessagePlainText } from "@/features/conversation/conversation-list/hooks/use-message-plain-text"
import { useToggleReadStatus } from "@/features/conversation/conversation-list/hooks/use-toggle-read-status"
import { useGroupName } from "@/features/groups/hooks/use-group-name"
import { useGroupQuery } from "@/features/groups/useGroupQuery"
import { useFocusRerender } from "@/hooks/use-focus-rerender"
import { useRouter } from "@/navigation/use-navigation"
import { IConversationTopic } from "../../conversation.types"
import { ConversationListItem } from "./conversation-list-item"
import { DeleteSwipeableAction } from "./conversation-list-item-swipeable/conversation-list-item-swipeable-delete-action"
import { ToggleUnreadSwipeableAction } from "./conversation-list-item-swipeable/conversation-list-item-swipeable-toggle-read-action"

type IConversationListItemGroupProps = {
  conversationTopic: IConversationTopic
}

export const ConversationListItemGroup = memo(function ConversationListItemGroup({
  conversationTopic,
}: IConversationListItemGroupProps) {
  const currentSender = useSafeCurrentSender()
  const router = useRouter()

  // Need this so the timestamp is updated on every focus
  useFocusRerender()

  const { data: group } = useGroupQuery({
    inboxId: currentSender.inboxId,
    topic: conversationTopic,
  })

  const { isUnread } = useConversationIsUnread({
    topic: conversationTopic,
  })

  const { groupName } = useGroupName({
    conversationTopic,
  })

  const onPress = useCallback(() => {
    router.navigate("Conversation", {
      topic: conversationTopic,
    })
  }, [conversationTopic, router])

  // Title
  const title = groupName

  // Subtitle
  const timestamp = group?.lastMessage?.sentNs ?? 0
  const timeToShow = getCompactRelativeTime(timestamp)
  const messageText = useMessagePlainText(group?.lastMessage)
  const subtitle = timeToShow && messageText ? `${timeToShow} ${MIDDLE_DOT} ${messageText}` : ""

  const { toggleReadStatusAsync } = useToggleReadStatus({
    topic: conversationTopic,
  })

  const renderLeftActions = useCallback((args: ISwipeableRenderActionsArgs) => {
    return <DeleteSwipeableAction {...args} />
  }, [])

  const renderRightActions = useCallback(
    (args: ISwipeableRenderActionsArgs) => {
      return <ToggleUnreadSwipeableAction {...args} topic={conversationTopic} />
    },
    [conversationTopic],
  )

  const onDeleteGroup = useDeleteGroup({
    groupTopic: conversationTopic,
  })

  return (
    <ConversationListItemSwipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      onLeftSwipe={onDeleteGroup}
      onRightSwipe={toggleReadStatusAsync}
    >
      <ConversationListItem
        onPress={onPress}
        showError={false}
        avatarComponent={<GroupAvatar size="lg" groupTopic={conversationTopic} />}
        title={title}
        subtitle={subtitle}
        isUnread={isUnread}
      />
    </ConversationListItemSwipeable>
  )
})
