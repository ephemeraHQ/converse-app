import { Avatar } from "@/components/Avatar";
import { ISwipeableRenderActionsArgs } from "@/components/swipeable";
import { ConversationListItemSwipeable } from "@/features/conversation-list/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useDeleteDm } from "@/features/conversation-list/hooks/use-delete-dm";
import { useToggleReadStatus } from "@/features/conversation-list/hooks/use-toggle-read-status";
import { useMessagePlainText } from "@/features/conversation-list/hooks/useMessagePlainText";
import { prefetchConversationMessages } from "@/queries/use-conversation-messages-query";
import { useConversationQuery } from "@/queries/useConversationQuery";
import { useDmPeerInboxId } from "@/queries/useDmPeerInbox";
import { useAppTheme } from "@/theme/useAppTheme";
import { DmWithCodecsType } from "@/utils/xmtpRN/client.types";
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
  });

  const { data: peerInboxId } = useDmPeerInboxId({
    account: currentAccount!,
    topic: conversationTopic,
  });

  const { theme } = useAppTheme();

  const messageText = useMessagePlainText(conversation?.lastMessage);
  const preferredName = usePreferredInboxName(peerInboxId);
  const avatarUri = usePreferredInboxAvatar(peerInboxId);

  const avatarComponent = useMemo(() => {
    return (
      <Avatar size={theme.avatarSize.lg} uri={avatarUri} name={preferredName} />
    );
  }, [avatarUri, preferredName, theme]);

  const onPress = useCallback(() => {
    prefetchConversationMessages(currentAccount, conversationTopic);
    navigate("Conversation", {
      topic: conversationTopic,
    });
  }, [currentAccount, conversationTopic]);

  // title
  const title = preferredName;

  // subtitle
  const timestamp = conversation?.lastMessage?.sentNs ?? 0;
  const timeToShow = getCompactRelativeTime(timestamp);
  const subtitle =
    timeToShow && messageText ? `${timeToShow} ⋅ ${messageText}` : "";

  const { isUnread } = useConversationIsUnread({
    topic: conversationTopic,
  });

  const renderLeftActions = useCallback((args: ISwipeableRenderActionsArgs) => {
    return <DeleteSwipeableAction {...args} />;
  }, []);

  const renderRightActions = useCallback(
    (args: ISwipeableRenderActionsArgs) => {
      return (
        <ToggleUnreadSwipeableAction {...args} topic={conversationTopic} />
      );
    },
    [conversationTopic]
  );

  const deleteDm = useDeleteDm(conversation as DmWithCodecsType);

  const { toggleReadStatusAsync } = useToggleReadStatus({
    topic: conversationTopic,
  });

  return (
    <ConversationListItemSwipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      onLeftSwipe={deleteDm}
      onRightSwipe={toggleReadStatusAsync}
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
