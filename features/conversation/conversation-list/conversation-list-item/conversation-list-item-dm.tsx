import { getCompactRelativeTime } from "@utils/date"
import { memo, useCallback, useMemo } from "react"
import { Avatar } from "@/components/avatar"
import { ISwipeableRenderActionsArgs } from "@/components/swipeable"
import { MIDDLE_DOT } from "@/design-system/middle-dot"
import { useSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import { ConversationListItemSwipeable } from "@/features/conversation/conversation-list/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable"
import { RestoreSwipeableAction } from "@/features/conversation/conversation-list/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable-restore-action"
import { useConversationIsDeleted } from "@/features/conversation/conversation-list/hooks/use-conversation-is-deleted"
import { useConversationIsUnread } from "@/features/conversation/conversation-list/hooks/use-conversation-is-unread"
import { useDeleteDm } from "@/features/conversation/conversation-list/hooks/use-delete-dm"
import { useMessagePlainText } from "@/features/conversation/conversation-list/hooks/use-message-plain-text"
import { useRestoreConversation } from "@/features/conversation/conversation-list/hooks/use-restore-conversation"
import { useToggleReadStatus } from "@/features/conversation/conversation-list/hooks/use-toggle-read-status"
import { useConversationQuery } from "@/features/conversation/queries/conversation.query"
import { useDmPeerInboxIdQuery } from "@/features/dm/dm-peer-inbox-id.query"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { IXmtpConversationId } from "@/features/xmtp/xmtp.types"
import { useFocusRerender } from "@/hooks/use-focus-rerender"
import { navigate } from "@/navigation/navigation.utils"
import { useAppTheme } from "@/theme/use-app-theme"
import { captureErrorWithToast } from "@/utils/capture-error"
import { ConversationListItem } from "./conversation-list-item"
import { DeleteSwipeableAction } from "./conversation-list-item-swipeable/conversation-list-item-swipeable-delete-action"
import { ToggleUnreadSwipeableAction } from "./conversation-list-item-swipeable/conversation-list-item-swipeable-toggle-read-action"

type IConversationListItemDmProps = {
  xmtpConversationId: IXmtpConversationId
}

export const ConversationListItemDm = memo(function ConversationListItemDm({
  xmtpConversationId,
}: IConversationListItemDmProps) {
  const currentSender = useSafeCurrentSender()
  const { theme } = useAppTheme()

  // Need this so the timestamp is updated on every focus
  useFocusRerender()

  // Conversation related hooks
  const { data: conversation } = useConversationQuery({
    clientInboxId: currentSender.inboxId,
    xmtpConversationId,
    caller: "Conversation List Item Dm",
  })

  const { data: peerInboxId } = useDmPeerInboxIdQuery({
    inboxId: currentSender.inboxId,
    xmtpConversationId,
    caller: "ConversationListItemDm",
  })

  const { displayName, avatarUrl } = usePreferredDisplayInfo({
    inboxId: peerInboxId,
  })

  // Status hooks
  const { isUnread } = useConversationIsUnread({ xmtpConversationId })
  const { isDeleted } = useConversationIsDeleted({ xmtpConversationId })
  const messageText = useMessagePlainText(conversation?.lastMessage)

  // Action hooks
  const deleteDm = useDeleteDm({ xmtpConversationId })
  const { restoreConversationAsync } = useRestoreConversation({
    xmtpConversationId,
  })
  const { toggleReadStatusAsync } = useToggleReadStatus({
    xmtpConversationId,
  })

  const timestamp = conversation?.lastMessage?.sentNs ?? 0

  // No need for timeToShow variable anymore
  const subtitle = !messageText
    ? ""
    : `${getCompactRelativeTime(timestamp)} ${MIDDLE_DOT} ${messageText}`

  const leftActionsBackgroundColor = useMemo(
    () => (isDeleted ? theme.colors.fill.tertiary : theme.colors.fill.caution),
    [isDeleted, theme],
  )

  // Handlers
  const onPress = useCallback(() => {
    navigate("Conversation", { xmtpConversationId })
  }, [xmtpConversationId])

  const onLeftSwipe = useCallback(async () => {
    try {
      await (isDeleted ? restoreConversationAsync() : deleteDm())
    } catch (error) {
      captureErrorWithToast(error)
    }
  }, [isDeleted, deleteDm, restoreConversationAsync])

  const onRightSwipe = useCallback(async () => {
    try {
      await toggleReadStatusAsync()
    } catch (error) {
      captureErrorWithToast(error)
    }
  }, [toggleReadStatusAsync])

  // Swipe action renderers
  const renderLeftActions = useCallback(
    (args: ISwipeableRenderActionsArgs) =>
      isDeleted ? <RestoreSwipeableAction {...args} /> : <DeleteSwipeableAction {...args} />,
    [isDeleted],
  )

  const renderRightActions = useCallback(
    (args: ISwipeableRenderActionsArgs) => (
      <ToggleUnreadSwipeableAction {...args} xmtpConversationId={xmtpConversationId} />
    ),
    [xmtpConversationId],
  )

  return (
    <ConversationListItemSwipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      onLeftSwipe={onLeftSwipe}
      onRightSwipe={onRightSwipe}
      leftActionsBackgroundColor={leftActionsBackgroundColor}
    >
      <ConversationListItem
        onPress={onPress}
        showError={false}
        avatarComponent={
          <Avatar sizeNumber={theme.avatarSize.lg} uri={avatarUrl} name={displayName} />
        }
        title={displayName}
        subtitle={subtitle}
        isUnread={isUnread}
      />
    </ConversationListItemSwipeable>
  )
})
