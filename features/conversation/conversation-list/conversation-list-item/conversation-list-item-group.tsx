import { getCompactRelativeTime } from "@utils/date"
import { memo, useCallback } from "react"
import { GroupAvatar } from "@/components/group-avatar"
import { ISwipeableRenderActionsArgs } from "@/components/swipeable"
import { MIDDLE_DOT } from "@/design-system/middle-dot"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { ConversationListItemSwipeable } from "@/features/conversation/conversation-list/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable"
import { useConversationIsUnread } from "@/features/conversation/conversation-list/hooks/use-conversation-is-unread"
import { useDeleteGroup } from "@/features/conversation/conversation-list/hooks/use-delete-group"
import { useMessageContentStringValue } from "@/features/conversation/conversation-list/hooks/use-message-content-string-value"
import { useToggleReadStatus } from "@/features/conversation/conversation-list/hooks/use-toggle-read-status"
import { useGroupName } from "@/features/groups/hooks/use-group-name"
import { useGroupQuery } from "@/features/groups/queries/group.query"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"
import { useFocusRerender } from "@/hooks/use-focus-rerender"
import { useRouter } from "@/navigation/use-navigation"
import { ConversationListItem } from "./conversation-list-item"
import { DeleteSwipeableAction } from "./conversation-list-item-swipeable/conversation-list-item-swipeable-delete-action"
import { ToggleUnreadSwipeableAction } from "./conversation-list-item-swipeable/conversation-list-item-swipeable-toggle-read-action"

type IConversationListItemGroupProps = {
  xmtpConversationId: IXmtpConversationId
}

export const ConversationListItemGroup = memo(function ConversationListItemGroup({
  xmtpConversationId,
}: IConversationListItemGroupProps) {
  const currentSender = useSafeCurrentSender()
  const router = useRouter()

  // Need this so the timestamp is updated on every focus
  useFocusRerender()

  const { data: group } = useGroupQuery({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
  })

  const { isUnread } = useConversationIsUnread({
    xmtpConversationId,
  })

  const { groupName } = useGroupName({
    xmtpConversationId,
  })

  const onPress = useCallback(() => {
    router.navigate("Conversation", {
      xmtpConversationId,
    })
  }, [xmtpConversationId, router])

  // Title
  const title = groupName

  // Subtitle
  const timestamp = group?.lastMessage?.sentNs ?? 0
  const timeToShow = getCompactRelativeTime(timestamp)
  const messageText = useMessageContentStringValue(group?.lastMessage)
  const subtitle = timeToShow && messageText ? `${timeToShow} ${MIDDLE_DOT} ${messageText}` : ""

  const { toggleReadStatusAsync } = useToggleReadStatus({
    xmtpConversationId,
  })

  const renderLeftActions = useCallback((args: ISwipeableRenderActionsArgs) => {
    return <DeleteSwipeableAction {...args} />
  }, [])

  const renderRightActions = useCallback(
    (args: ISwipeableRenderActionsArgs) => {
      return <ToggleUnreadSwipeableAction {...args} xmtpConversationId={xmtpConversationId} />
    },
    [xmtpConversationId],
  )

  const onDeleteGroup = useDeleteGroup({
    xmtpConversationId,
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
        avatarComponent={<GroupAvatar size="lg" xmtpConversationId={xmtpConversationId} />}
        title={title}
        subtitle={subtitle}
        isUnread={isUnread}
      />
    </ConversationListItemSwipeable>
  )
})
