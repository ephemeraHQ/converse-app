import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { translate } from "@i18n/index";
import { AvatarSizes } from "@styles/sizes";
import { saveTopicsData } from "@utils/api";
import { getMinimalDate } from "@utils/date";
import { groupRemoveRestoreHandler } from "@utils/groupUtils/groupActionHandlers";
import { Haptics } from "@utils/haptics";
import { navigate } from "@utils/navigation";
import { RefObject, useCallback, useMemo, useRef, useState } from "react";
import { useColorScheme } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

import Avatar from "./Avatar";
import { ConversationContextMenu } from "./ConversationContextMenu";
import { ConversationListItemDumb } from "./ConversationListItem/ConversationListItemDumb";
import { GroupAvatarDumb } from "./GroupAvatar";
import { getMessageContentType } from "@utils/xmtpRN/contentTypes";
import logger from "@utils/logger";
import { useGroupConversationListAvatarInfo } from "../features/conversation-list/useGroupConversationListAvatarInfo";
import { IIconName } from "@design-system/Icon/Icon.types";
import { GroupWithCodecsType } from "@utils/xmtpRN/client";

type V3GroupConversationListItemProps = {
  group: GroupWithCodecsType;
};

type UseDataProps = {
  group: GroupWithCodecsType;
};

const useData = ({ group }: UseDataProps) => {
  // TODO Items
  const isBlockedChatView = false;

  const colorScheme = useColorScheme();
  const currentAccount = useCurrentAccount()!;
  const { topicsData, setTopicsData, setPinnedConversations } = useChatStore(
    useSelect(["topicsData", "setTopicsData", "setPinnedConversations"])
  );

  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const showContextMenu = useCallback(() => {
    setIsContextMenuVisible(true);
  }, []);

  const groupExists = !!group;
  const topic = group?.topic;
  const timestamp = group?.lastMessage?.sent ?? 0;

  const isUnread = useMemo(() => {
    if (!groupExists) return false;
    if (topicsData[topic]?.status === "unread") {
      return true;
    }
    if (group.lastMessage?.senderAddress === group?.client.inboxId) {
      return false;
    }
    const readUntil = topicsData[topic]?.readUntil || 0;
    return readUntil < (timestamp ?? 0);
  }, [
    groupExists,
    topicsData,
    topic,
    group.lastMessage?.senderAddress,
    group?.client.inboxId,
    timestamp,
  ]);

  const { memberData } = useGroupConversationListAvatarInfo(
    currentAccount,
    group
  );

  const toggleReadStatus = useCallback(() => {
    const newStatus = isUnread ? "read" : "unread";
    const timestamp = new Date().getTime();
    setTopicsData({
      [topic]: {
        status: newStatus,
        timestamp,
      },
    });
    saveTopicsData(currentAccount, {
      [topic]: {
        status: newStatus,
        timestamp,
      },
    });
  }, [setTopicsData, topic, isUnread, currentAccount]);

  const closeContextMenu = useCallback((openConversationOnClose = false) => {
    setIsContextMenuVisible(false);
    if (openConversationOnClose) {
      // openConversation();
    }
  }, []);

  const contextMenuItems = useMemo(
    () => [
      {
        title: translate("pin"),
        action: () => {
          setPinnedConversations([topic]);
          closeContextMenu();
        },
        id: "pin",
      },
      {
        title: isUnread
          ? translate("mark_as_read")
          : translate("mark_as_unread"),
        action: () => {
          toggleReadStatus();
          closeContextMenu();
        },
        id: "markAsUnread",
      },
      {
        title: translate("delete"),
        action: () => {
          // handleDelete();
          closeContextMenu();
        },
        id: "delete",
      },
    ],
    [
      topic,
      setPinnedConversations,
      // handleDelete,
      closeContextMenu,
      isUnread,
      toggleReadStatus,
    ]
  );

  const handleRemoveRestore = useCallback(
    (callback: () => void) => {
      groupRemoveRestoreHandler(
        group?.state,
        colorScheme,
        group?.name,
        () => {},
        () => {}
      )((success: boolean) => {
        // If not successful, do nothing (user canceled)
        callback();
      });
    },
    [group?.state, colorScheme, group?.name]
  );

  const messageText = useMemo(() => {
    const lastMessage = group?.lastMessage;
    if (!lastMessage) return "";
    try {
      const content = group?.lastMessage?.content();
      const contentType = getMessageContentType(lastMessage.contentTypeId);
      if (contentType === "groupUpdated") {
        //  TODO: Update this
        return "Group updated";
      }
      if (typeof content === "string") {
        return content;
      }
      return group?.lastMessage?.fallback;
    } catch (e) {
      logger.error("Error getting message text", {
        error: e,
        contentTypeId: lastMessage?.contentTypeId,
      });
      return group?.lastMessage?.fallback;
    }
  }, [group?.lastMessage]);

  return {
    group,
    memberData,
    timestamp,
    isContextMenuVisible,
    contextMenuItems,
    showContextMenu,
    toggleReadStatus,
    closeContextMenu,
    isUnread,
    isBlockedChatView,
    handleRemoveRestore,
    messageText,
  };
};

type UseUserInteractionsProps = {
  topic: string;
  ref: RefObject<Swipeable>;
  showContextMenu: () => void;
  toggleReadStatus: () => void;
  handleRemoveRestore: (callback: () => void) => void;
};

const useUserInteractions = ({
  topic,
  ref,
  showContextMenu,
  toggleReadStatus,
  handleRemoveRestore,
}: UseUserInteractionsProps) => {
  const onPress = useCallback(() => {
    navigate("Conversation", {
      topic,
    });
  }, [topic]);

  const triggerHapticFeedback = useCallback(() => {
    return Haptics.mediumImpactAsync();
  }, []);

  const onLongPress = useCallback(() => {
    runOnJS(triggerHapticFeedback)();
    runOnJS(showContextMenu)();
  }, [triggerHapticFeedback, showContextMenu]);

  const onLeftPress = useCallback(() => {}, []);

  const onRightPress = useCallback(() => {
    handleRemoveRestore(() => ref.current?.close());
  }, [handleRemoveRestore, ref]);

  const onLeftSwipe = useCallback(() => {
    toggleReadStatus();
  }, [toggleReadStatus]);

  const onWillLeftSwipe = useCallback(() => {
    Haptics.successNotificationAsync();
  }, []);

  const onRightSwipe = useCallback(() => {}, []);

  const onWillRightSwipe = useCallback(() => {}, []);

  return {
    onPress,
    onLongPress,
    onLeftPress,
    onRightPress,
    onLeftSwipe,
    onRightSwipe,
    onWillLeftSwipe,
    onWillRightSwipe,
  };
};

type UseDisplayInfoProps = {
  timestamp: number;
  isUnread: boolean;
};
const useDisplayInfo = ({ timestamp, isUnread }: UseDisplayInfoProps) => {
  const timeToShow = getMinimalDate(timestamp);
  const colorScheme = useColorScheme();
  const leftActionIcon: IIconName = isUnread
    ? "checkmark.message"
    : "message.badge";
  return { timeToShow, colorScheme, leftActionIcon };
};

export function V3GroupConversationListItem({
  group,
}: V3GroupConversationListItemProps) {
  const {
    memberData,
    timestamp,
    isContextMenuVisible,
    showContextMenu,
    contextMenuItems,
    closeContextMenu,
    isUnread,
    isBlockedChatView,
    toggleReadStatus,
    handleRemoveRestore,
    messageText,
  } = useData({ group });
  const ref = useRef<Swipeable>(null);
  const {
    onPress,
    onLongPress,
    onLeftPress,
    onRightPress,
    onLeftSwipe,
    onRightSwipe,
    onWillLeftSwipe,
    onWillRightSwipe,
  } = useUserInteractions({
    ref,
    topic: group?.topic,
    showContextMenu,
    toggleReadStatus,
    handleRemoveRestore,
  });
  const { timeToShow, leftActionIcon } = useDisplayInfo({
    timestamp,
    isUnread,
  });

  const contextMenuComponent = useMemo(
    () => (
      <ConversationContextMenu
        isVisible={isContextMenuVisible}
        onClose={closeContextMenu}
        items={contextMenuItems}
        conversationTopic={group?.topic}
      />
    ),
    [isContextMenuVisible, closeContextMenu, contextMenuItems, group?.topic]
  );

  const avatarComponent = useMemo(() => {
    return group?.imageUrlSquare ? (
      <Avatar
        size={AvatarSizes.conversationListItem}
        uri={group?.imageUrlSquare}
        style={{ marginLeft: 16, alignSelf: "center" }}
      />
    ) : (
      <GroupAvatarDumb
        size={AvatarSizes.conversationListItem}
        members={memberData}
        style={{ marginLeft: 16, alignSelf: "center" }}
      />
    );
  }, [group?.imageUrlSquare, memberData]);

  return (
    <ConversationListItemDumb
      ref={ref}
      onPress={onPress}
      onRightActionPress={onRightPress}
      onLongPress={onLongPress}
      onRightSwipe={onRightSwipe}
      onLeftSwipe={onLeftSwipe}
      onWillRightSwipe={onWillRightSwipe}
      onWillLeftSwipe={onWillLeftSwipe}
      leftActionIcon={leftActionIcon}
      showError={false}
      showImagePreview={false}
      imagePreviewUrl={undefined}
      avatarComponent={avatarComponent}
      title={group?.name}
      subtitle={`${timeToShow} ⋅ ${messageText}`}
      contextMenuComponent={contextMenuComponent}
      isUnread={isUnread}
      rightIsDestructive={isBlockedChatView}
    />
  );
}
