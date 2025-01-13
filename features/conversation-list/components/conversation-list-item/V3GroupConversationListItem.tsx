import { Avatar } from "@/components/Avatar";
import { GroupAvatarDumb } from "@/components/GroupAvatar";
import { ISwipeableRenderActionsArgs } from "@/components/swipeable";
import { ConversationListItemSwipeable } from "@/features/conversation-list/components/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable";
import { ToggleUnreadSwipeableAction } from "./conversation-list-item-swipeable/conversation-list-item-swipeable-toggle-read-action";
import { DeleteSwipeableAction } from "./conversation-list-item-swipeable/conversation-list-item-swipeable-delete-action";
import { useHandleDeleteGroup } from "@/features/conversation-list/hooks/useHandleDeleteGroup";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/useMessageIsUnread";
import { useMessageText } from "@/features/conversation-list/hooks/useMessageText";
import { useToggleReadStatus } from "@/features/conversation-list/hooks/useToggleReadStatus";
import { useGroupConversationListAvatarInfo } from "@/features/conversation-list/useGroupConversationListAvatarInfo";
import { prefetchConversationMessages } from "@/queries/useConversationMessages";
import { useAppTheme } from "@/theme/useAppTheme";
import { GroupWithCodecsType } from "@/utils/xmtpRN/client.types";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useRouter } from "@navigation/useNavigation";
import { getMinimalDate } from "@utils/date";
import { useCallback, useMemo } from "react";
import { ConversationListItem } from "./conversation-list-item";

type V3GroupConversationListItemProps = {
  group: GroupWithCodecsType;
};

export function V3GroupConversationListItem({
  group,
}: V3GroupConversationListItemProps) {
  const { theme } = useAppTheme();
  const currentAccount = useCurrentAccount()!;
  const router = useRouter();

  const topic = group?.topic;
  const timestamp = group?.lastMessage?.sentNs ?? 0;

  const isUnread = useConversationIsUnread({
    topic,
    lastMessage: group.lastMessage,
    timestampNs: timestamp,
  });

  const { memberData } = useGroupConversationListAvatarInfo(
    currentAccount,
    group
  );

  const avatarComponent = useMemo(() => {
    return group?.imageUrlSquare ? (
      <Avatar size={theme.avatarSize.lg} uri={group?.imageUrlSquare} />
    ) : (
      <GroupAvatarDumb size={theme.avatarSize.lg} members={memberData} />
    );
  }, [group?.imageUrlSquare, memberData, theme]);

  const onPress = useCallback(() => {
    prefetchConversationMessages(currentAccount, topic);
    router.navigate("Conversation", {
      topic,
    });
  }, [topic, currentAccount, router]);

  // Title
  const title = group?.name;

  // Subtitle
  const timeToShow = getMinimalDate(timestamp);
  const messageText = useMessageText(group.lastMessage);
  const subtitle =
    timeToShow && messageText ? `${timeToShow} ⋅ ${messageText}` : "";

  const toggleReadStatus = useToggleReadStatus({
    topic,
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

  const onDeleteGroup = useHandleDeleteGroup({
    groupTopic: topic,
  });

  return (
    <ConversationListItemSwipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      onLeftSwipe={onDeleteGroup}
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
    </ConversationListItemSwipeable>
  );
}
