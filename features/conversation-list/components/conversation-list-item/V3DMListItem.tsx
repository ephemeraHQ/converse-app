import { Avatar } from "@/components/Avatar";
import { ISwipeableRenderActionsArgs, Swipeable } from "@/components/swipeable";
import {
  DeleteSwipeableAction,
  ToggleUnreadSwipeableAction,
} from "@/features/conversation-list/components/conversation-list-item/conversation-list-item-swipeable";
import { useHandleDeleteDm } from "@/features/conversation-list/hooks/useHandleDeleteDm";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/useMessageIsUnread";
import { useMessageText } from "@/features/conversation-list/hooks/useMessageText";
import { useToggleReadStatus } from "@/features/conversation-list/hooks/useToggleReadStatus";
import { prefetchConversationMessages } from "@/queries/useConversationMessages";
import { useDmPeerInboxId } from "@/queries/useDmPeerInbox";
import { useAppTheme } from "@/theme/useAppTheme";
import { DmWithCodecsType } from "@/utils/xmtpRN/client.types";
import { useCurrentAccount } from "@data/store/accountsStore";
import { usePreferredInboxAvatar } from "@hooks/usePreferredInboxAvatar";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
import { getMinimalDate } from "@utils/date";
import { navigate } from "@utils/navigation";
import { useCallback, useMemo } from "react";
import { ConversationListItem } from "./conversation-list-item";

type V3DMListItemProps = {
  conversation: DmWithCodecsType;
};

export const V3DMListItem = ({ conversation }: V3DMListItemProps) => {
  const currentAccount = useCurrentAccount()!;

  const topic = conversation.topic;

  const { data: peerInboxId } = useDmPeerInboxId({
    account: currentAccount!,
    topic,
  });

  const { theme } = useAppTheme();

  const messageText = useMessageText(conversation.lastMessage);
  const preferredName = usePreferredInboxName(peerInboxId);
  const avatarUri = usePreferredInboxAvatar(peerInboxId);

  const avatarComponent = useMemo(() => {
    return (
      <Avatar size={theme.avatarSize.lg} uri={avatarUri} name={preferredName} />
    );
  }, [avatarUri, preferredName, theme]);

  const onPress = useCallback(() => {
    prefetchConversationMessages(currentAccount, topic);
    navigate("Conversation", {
      topic: topic,
    });
  }, [topic, currentAccount]);

  // title
  const title = preferredName;

  // subtitle
  const timestamp = conversation?.lastMessage?.sentNs ?? 0;
  const timeToShow = getMinimalDate(timestamp);
  const subtitle =
    timeToShow && messageText ? `${timeToShow} ⋅ ${messageText}` : "";

  const isUnread = useConversationIsUnread({
    topic,
    lastMessage: conversation.lastMessage,
    timestampNs: timestamp,
  });

  const renderLeftActions = useCallback((args: ISwipeableRenderActionsArgs) => {
    return <DeleteSwipeableAction {...args} />;
  }, []);

  const renderRightActions = useCallback(
    (args: ISwipeableRenderActionsArgs) => {
      return <ToggleUnreadSwipeableAction {...args} topic={topic} />;
    },
    [topic]
  );

  const deleteDm = useHandleDeleteDm(conversation);

  const toggleReadStatus = useToggleReadStatus({
    topic,
  });

  return (
    <Swipeable
      closeOnOpen
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      leftThreshold={theme.spacing["5xl"]}
      leftActionsBackgroundColor={theme.colors.fill.caution}
      rightActionsBackgroundColor={theme.colors.fill.minimal}
      onLeftSwipe={deleteDm}
      onRightSwipe={toggleReadStatus}
    >
      <ConversationListItem
        onPress={onPress}
        showError={false}
        avatarComponent={avatarComponent}
        title={title}
        subtitle={subtitle}
        isUnread={isUnread}
      />
    </Swipeable>
  );
};
