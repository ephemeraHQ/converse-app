import { Avatar } from "@/components/Avatar";
import { ISwipeableRenderActionsArgs } from "@/components/swipeable";
import { MIDDLE_DOT } from "@/design-system/middle-dot";
import { ConversationListItemSwipeable } from "@/features/conversation-list/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable";
import { RestoreSwipeableAction } from "@/features/conversation-list/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable-restore-action";
import { useConversationIsDeleted } from "@/features/conversation-list/hooks/use-conversation-is-deleted";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useDeleteDm } from "@/features/conversation-list/hooks/use-delete-dm";
import { useMessagePlainText } from "@/features/conversation-list/hooks/use-message-plain-text";
import { useRestoreConversation } from "@/features/conversation-list/hooks/use-restore-conversation";
import { useToggleReadStatus } from "@/features/conversation-list/hooks/use-toggle-read-status";
import { useCurrentAccount } from "@/features/multi-inbox/multi-inbox.store";
import { useProfileQuery } from "@/features/profiles/profiles.query";
import { useConversationQuery } from "@/queries/conversation-query";
import { useDmPeerInboxIdQuery } from "@/queries/use-dm-peer-inbox-id-query";
import { useAppTheme } from "@/theme/useAppTheme";
import { captureErrorWithToast } from "@/utils/capture-error";
import { getCompactRelativeTime } from "@utils/date";
import { navigate } from "@utils/navigation";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { memo, useCallback, useMemo } from "react";
import { ConversationListItem } from "./conversation-list-item";
import { DeleteSwipeableAction } from "./conversation-list-item-swipeable/conversation-list-item-swipeable-delete-action";
import { ToggleUnreadSwipeableAction } from "./conversation-list-item-swipeable/conversation-list-item-swipeable-toggle-read-action";

type IConversationListItemDmProps = {
  conversationTopic: ConversationTopic;
};

export const ConversationListItemDm = memo(function ConversationListItemDm({
  conversationTopic,
}: IConversationListItemDmProps) {
  const currentAccount = useCurrentAccount()!;
  const { theme } = useAppTheme();

  // Conversation related hooks
  const { data: conversation } = useConversationQuery({
    account: currentAccount,
    topic: conversationTopic,
    caller: "Conversation List Item Dm",
  });

  const { data: peerInboxId, isLoading: isLoadingPeerInboxId } =
    useDmPeerInboxIdQuery({
      account: currentAccount,
      topic: conversationTopic,
      caller: "ConversationListItemDm",
    });

  // Peer info hooks
  const { data: profile } = useProfileQuery({ xmtpId: peerInboxId });

  // Status hooks
  const { isUnread } = useConversationIsUnread({ topic: conversationTopic });
  const { isDeleted } = useConversationIsDeleted({ conversationTopic });
  const messageText = useMessagePlainText(conversation?.lastMessage);

  // Action hooks
  const deleteDm = useDeleteDm({ topic: conversationTopic });
  const { restoreConversationAsync } = useRestoreConversation({
    topic: conversationTopic,
  });
  const { toggleReadStatusAsync } = useToggleReadStatus({
    topic: conversationTopic,
  });

  // Computed values
  const title = useMemo(() => {
    if (profile?.name) return profile.name;
    return isLoadingPeerInboxId ? " " : "";
  }, [profile, isLoadingPeerInboxId]);

  const timestamp = conversation?.lastMessage?.sentNs ?? 0;
  const timeToShow = getCompactRelativeTime(timestamp);

  const subtitle = useMemo(() => {
    if (!timeToShow || !messageText) return "";
    return `${timeToShow} ${MIDDLE_DOT} ${messageText}`;
  }, [timeToShow, messageText]);

  const leftActionsBackgroundColor = useMemo(
    () => (isDeleted ? theme.colors.fill.tertiary : theme.colors.fill.caution),
    [isDeleted, theme]
  );

  // Handlers
  const onPress = useCallback(() => {
    navigate("Conversation", { topic: conversationTopic });
  }, [conversationTopic]);

  const onLeftSwipe = useCallback(async () => {
    try {
      await (isDeleted ? restoreConversationAsync() : deleteDm());
    } catch (error) {
      captureErrorWithToast(error);
    }
  }, [isDeleted, deleteDm, restoreConversationAsync]);

  const onRightSwipe = useCallback(async () => {
    try {
      await toggleReadStatusAsync();
    } catch (error) {
      captureErrorWithToast(error);
    }
  }, [toggleReadStatusAsync]);

  // Swipe action renderers
  const renderLeftActions = useCallback(
    (args: ISwipeableRenderActionsArgs) =>
      isDeleted ? (
        <RestoreSwipeableAction {...args} />
      ) : (
        <DeleteSwipeableAction {...args} />
      ),
    [isDeleted]
  );

  const renderRightActions = useCallback(
    (args: ISwipeableRenderActionsArgs) => (
      <ToggleUnreadSwipeableAction {...args} topic={conversationTopic} />
    ),
    [conversationTopic]
  );

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
          <Avatar
            size={theme.avatarSize.lg}
            uri={profile?.avatarUrl}
            name={title}
          />
        }
        title={title}
        subtitle={subtitle}
        isUnread={isUnread}
      />
    </ConversationListItemSwipeable>
  );
});
