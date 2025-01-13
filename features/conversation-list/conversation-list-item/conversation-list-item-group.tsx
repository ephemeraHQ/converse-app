import { Avatar } from "@/components/Avatar";
import { GroupAvatarDumb } from "@/components/GroupAvatar";
import { ISwipeableRenderActionsArgs } from "@/components/swipeable";
import { ConversationListItemSwipeable } from "@/features/conversation-list/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useDeleteGroup } from "@/features/conversation-list/hooks/use-delete-group";
import { useToggleReadStatus } from "@/features/conversation-list/hooks/use-toggle-read-status";
import { useMessagePlainText } from "@/features/conversation-list/hooks/useMessagePlainText";
import { useCurrentAccountGroupMembersInfo } from "@/hooks/use-current-account-group-members-info";
import { prefetchConversationMessages } from "@/queries/useConversationMessages";
import { useAppTheme } from "@/theme/useAppTheme";
import { GroupWithCodecsType } from "@/utils/xmtpRN/client.types";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useRouter } from "@navigation/useNavigation";
import { getCompactRelativeTime } from "@utils/date";
import { memo, useCallback, useMemo } from "react";
import { ConversationListItem } from "./conversation-list-item";
import { DeleteSwipeableAction } from "./conversation-list-item-swipeable/conversation-list-item-swipeable-delete-action";
import { ToggleUnreadSwipeableAction } from "./conversation-list-item-swipeable/conversation-list-item-swipeable-toggle-read-action";

type IConversationListItemGroupProps = {
  group: GroupWithCodecsType;
};

export const ConversationListItemGroup = memo(
  function ConversationListItemGroup({
    group,
  }: IConversationListItemGroupProps) {
    const { theme } = useAppTheme();
    const currentAccount = useCurrentAccount()!;
    const router = useRouter();

    const topic = group?.topic;
    const timestamp = group?.lastMessage?.sentNs ?? 0;

    const { isUnread } = useConversationIsUnread({
      topic,
    });

    const { groupMembersInfo } = useCurrentAccountGroupMembersInfo({
      currentAccount,
      groupTopic: topic,
    });

    const avatarComponent = useMemo(() => {
      return group?.imageUrlSquare ? (
        <Avatar size={theme.avatarSize.lg} uri={group?.imageUrlSquare} />
      ) : (
        <GroupAvatarDumb
          size={theme.avatarSize.lg}
          members={groupMembersInfo}
        />
      );
    }, [group?.imageUrlSquare, groupMembersInfo, theme]);

    const onPress = useCallback(() => {
      prefetchConversationMessages(currentAccount, topic);
      router.navigate("Conversation", {
        topic,
      });
    }, [topic, currentAccount, router]);

    // Title
    const title = group?.name;

    // Subtitle
    const timeToShow = getCompactRelativeTime(timestamp);
    const messageText = useMessagePlainText(group.lastMessage);
    const subtitle =
      timeToShow && messageText ? `${timeToShow} ⋅ ${messageText}` : "";

    const { toggleReadStatusAsync } = useToggleReadStatus({
      topic,
    });

    const renderLeftActions = useCallback(
      (args: ISwipeableRenderActionsArgs) => {
        return <DeleteSwipeableAction {...args} />;
      },
      []
    );

    const renderRightActions = useCallback(
      (args: ISwipeableRenderActionsArgs) => {
        return <ToggleUnreadSwipeableAction {...args} topic={topic} />;
      },
      [topic]
    );

    const onDeleteGroup = useDeleteGroup({
      groupTopic: topic,
    });

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
          avatarComponent={avatarComponent}
          title={title}
          subtitle={subtitle}
          isUnread={isUnread}
        />
      </ConversationListItemSwipeable>
    );
  }
);
