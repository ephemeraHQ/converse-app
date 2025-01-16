import { Avatar } from "@/components/Avatar";
import { GroupAvatarDumb } from "@/components/GroupAvatar";
import { ISwipeableRenderActionsArgs } from "@/components/swipeable";
import { ConversationListItemSwipeable } from "@/features/conversation-list/conversation-list-item/conversation-list-item-swipeable/conversation-list-item-swipeable";
import { useConversationIsUnread } from "@/features/conversation-list/hooks/use-conversation-is-unread";
import { useDeleteGroup } from "@/features/conversation-list/hooks/use-delete-group";
import { useToggleReadStatus } from "@/features/conversation-list/hooks/use-toggle-read-status";
import { useMessagePlainText } from "@/features/conversation-list/hooks/useMessagePlainText";
import { useGroupMembersInfoForCurrentAccount } from "@/hooks/use-group-members-info-for-current-account";
import { useGroupQuery } from "@/queries/useGroupQuery";
import { useAppTheme } from "@/theme/useAppTheme";
import { useCurrentAccount } from "@data/store/accountsStore";
import { useRouter } from "@navigation/useNavigation";
import { getCompactRelativeTime } from "@utils/date";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { memo, useCallback, useMemo } from "react";
import { ConversationListItem } from "./conversation-list-item";
import { DeleteSwipeableAction } from "./conversation-list-item-swipeable/conversation-list-item-swipeable-delete-action";
import { ToggleUnreadSwipeableAction } from "./conversation-list-item-swipeable/conversation-list-item-swipeable-toggle-read-action";

type IConversationListItemGroupProps = {
  conversationTopic: ConversationTopic;
};

export const ConversationListItemGroup = memo(
  function ConversationListItemGroup({
    conversationTopic,
  }: IConversationListItemGroupProps) {
    const { theme } = useAppTheme();
    const currentAccount = useCurrentAccount()!;
    const router = useRouter();

    const { data: group } = useGroupQuery({
      account: currentAccount,
      topic: conversationTopic,
    });

    const { isUnread } = useConversationIsUnread({
      topic: conversationTopic,
    });

    const { groupMembersInfo } = useGroupMembersInfoForCurrentAccount({
      groupTopic: conversationTopic,
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
      router.navigate("Conversation", {
        topic: conversationTopic,
      });
    }, [conversationTopic, router]);

    // Title
    const title = group?.name;

    // Subtitle
    const timestamp = group?.lastMessage?.sentNs ?? 0;
    const timeToShow = getCompactRelativeTime(timestamp);
    const messageText = useMessagePlainText(group?.lastMessage);
    const subtitle =
      timeToShow && messageText ? `${timeToShow} ⋅ ${messageText}` : "";

    const { toggleReadStatusAsync } = useToggleReadStatus({
      topic: conversationTopic,
    });

    const renderLeftActions = useCallback(
      (args: ISwipeableRenderActionsArgs) => {
        return <DeleteSwipeableAction {...args} />;
      },
      []
    );

    const renderRightActions = useCallback(
      (args: ISwipeableRenderActionsArgs) => {
        return (
          <ToggleUnreadSwipeableAction {...args} topic={conversationTopic} />
        );
      },
      [conversationTopic]
    );

    const onDeleteGroup = useDeleteGroup({
      groupTopic: conversationTopic,
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
