import { Avatar } from "@/components/Avatar";
import { ISwipeableRenderActionsArgs } from "@/components/swipeable";
import { MIDDLE_DOT } from "@/design-system/middle-dot";
import { ConversationListItemSwipeable } from "@/features/conversation-list/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable";
import { RestoreSwipeableAction } from "@/features/conversation-list/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable-restore-action";
import { useConversationIsDeleted } from "@/features/conversation-list/hooks/use-conversation-is-deleted";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useDeleteDm } from "@/features/conversation-list/hooks/use-delete-dm";
import { useRestoreConversation } from "@/features/conversation-list/hooks/use-restore-conversation";
import { useToggleReadStatus } from "@/features/conversation-list/hooks/use-toggle-read-status";
import { useMessagePlainText } from "@/features/conversation-list/hooks/useMessagePlainText";
import { useConversationQuery } from "@/queries/useConversationQuery";
import { useDmPeerInboxIdQuery } from "@/queries/use-dm-peer-inbox-id-query";
import { useAppTheme } from "@/theme/useAppTheme";
import { captureErrorWithToast } from "@/utils/capture-error";
import { useCurrentAccount } from "@data/store/accountsStore";
import { usePreferredInboxAvatar } from "@hooks/usePreferredInboxAvatar";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
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

  const { data: conversation } = useConversationQuery({
    account: currentAccount!,
    topic: conversationTopic,
    caller: "Conversation List Item Dm",
  });

  const { data: peerInboxId, isLoading: isLoadingPeerInboxId } =
    useDmPeerInboxIdQuery({
      account: currentAccount!,
      topic: conversationTopic,
      caller: "ConversationListItemDm",
    });

  const deleteDm = useDeleteDm({
    topic: conversationTopic,
  });
  const { restoreConversationAsync } = useRestoreConversation({
    topic: conversationTopic,
  });

  const { theme } = useAppTheme();

  const messageText = useMessagePlainText(conversation?.lastMessage);
  const { data: preferredName, isLoading: isLoadingPreferredName } =
    usePreferredInboxName({
      inboxId: peerInboxId,
    });
  const { data: avatarUri } = usePreferredInboxAvatar(peerInboxId);

  const avatarComponent = useMemo(() => {
    return (
      <Avatar size={theme.avatarSize.lg} uri={avatarUri} name={preferredName} />
    );
  }, [avatarUri, preferredName, theme]);

  const onPress = useCallback(() => {
    navigate("Conversation", {
      topic: conversationTopic,
    });
  }, [conversationTopic]);

  const title = useMemo(() => {
    if (!!preferredName) {
      return preferredName;
    }

    // Empty string just so we don't see a jump when we finish loading names
    if (isLoadingPreferredName || isLoadingPeerInboxId) {
      return " ";
    }

    // Empty string so UI looks better
    return " ";
  }, [preferredName, isLoadingPreferredName, isLoadingPeerInboxId]);

  // Need to be out of the useMemo so that the relative time update every time we update conversation or cause a rerender to this component
  const timestamp = conversation?.lastMessage?.sentNs ?? 0;
  const timeToShow = getCompactRelativeTime(timestamp);

  const subtitle = useMemo(() => {
    if (!timeToShow || !messageText) {
      return "";
    }

    return `${timeToShow} ${MIDDLE_DOT} ${messageText}`;
  }, [timeToShow, messageText]);

  const { isUnread } = useConversationIsUnread({
    topic: conversationTopic,
  });

  const { isDeleted } = useConversationIsDeleted({
    conversationTopic,
  });

  const renderLeftActions = useCallback(
    (args: ISwipeableRenderActionsArgs) => {
      if (isDeleted) {
        return <RestoreSwipeableAction {...args} />;
      }
      return <DeleteSwipeableAction {...args} />;
    },
    [isDeleted]
  );

  const renderRightActions = useCallback(
    (args: ISwipeableRenderActionsArgs) => {
      return (
        <ToggleUnreadSwipeableAction {...args} topic={conversationTopic} />
      );
    },
    [conversationTopic]
  );

  const onLeftSwipe = useCallback(async () => {
    try {
      if (isDeleted) {
        await restoreConversationAsync();
      } else {
        await deleteDm();
      }
    } catch (error) {
      captureErrorWithToast(error);
    }
  }, [isDeleted, deleteDm, restoreConversationAsync]);

  const { toggleReadStatusAsync } = useToggleReadStatus({
    topic: conversationTopic,
  });

  const onRightSwipe = useCallback(async () => {
    try {
      await toggleReadStatusAsync();
    } catch (error) {
      captureErrorWithToast(error);
    }
  }, [toggleReadStatusAsync]);

  const leftActionsBackgroundColor = useMemo(() => {
    if (isDeleted) {
      return theme.colors.fill.tertiary;
    }
    return theme.colors.fill.caution;
  }, [isDeleted, theme]);

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
        avatarComponent={avatarComponent}
        title={title}
        subtitle={subtitle}
        isUnread={isUnread}
      />
    </ConversationListItemSwipeable>
  );
});
