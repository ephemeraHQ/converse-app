import {
  useChatStore,
  useCurrentAccount,
  useSettingsStore,
} from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { translate } from "@i18n/index";
import { AvatarSizes } from "@styles/sizes";
import { saveTopicsData } from "@utils/api";
import { getMinimalDate } from "@utils/date";
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
import { useRoute } from "@navigation/useNavigation";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";
import { actionSheetColors } from "@styles/colors";
import { consentToInboxIdsOnProtocolByAccount } from "@utils/xmtpRN/contacts";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { prefetchConversationMessages } from "@queries/useConversationMessages";

type V3GroupConversationListItemProps = {
  group: GroupWithCodecsType;
};

type UseDataProps = {
  group: GroupWithCodecsType;
};

const useData = ({ group }: UseDataProps) => {
  // TODO Items
  const { name: routeName } = useRoute();
  const isBlockedChatView = routeName === "Blocked";
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
  const timestamp = group?.lastMessage?.sentNs ?? 0;

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

  const { setInboxIdPeerStatus } = useSettingsStore(
    useSelect(["setInboxIdPeerStatus"])
  );

  const handleDelete = useCallback(() => {
    const options = [
      translate("delete"),
      translate("delete_and_block"),
      translate("cancel"),
    ];
    const title = `${translate("delete_chat_with")} ${group?.name}?`;
    const actions = [
      () => {
        saveTopicsData(currentAccount, {
          [topic]: {
            status: "deleted",
            timestamp: new Date().getTime(),
          },
        }),
          setTopicsData({
            [topic]: {
              status: "deleted",
              timestamp: new Date().getTime(),
            },
          });
      },
      async () => {
        saveTopicsData(currentAccount, {
          [topic]: { status: "deleted" },
        });
        setTopicsData({
          [topic]: {
            status: "deleted",
            timestamp: new Date().getTime(),
          },
        });
        await group.updateConsent("denied");
        await consentToInboxIdsOnProtocolByAccount({
          account: currentAccount,
          inboxIds: [group.addedByInboxId],
          consent: "deny",
        });
        setInboxIdPeerStatus({
          [group.addedByInboxId]: "denied",
        });
      },
    ];
    // TODO: Implement
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        destructiveButtonIndex: [0, 1],
        title,
        ...actionSheetColors(colorScheme),
      },
      async (selectedIndex?: number) => {
        if (selectedIndex !== undefined && selectedIndex < actions.length) {
          actions[selectedIndex]();
        }
      }
    );
  }, [
    colorScheme,
    currentAccount,
    group,
    setInboxIdPeerStatus,
    setTopicsData,
    topic,
  ]);

  const handleRestore = useCallback(() => {
    // TODO: Implement
    const options = [
      translate("restore"),
      translate("restore_and_unblock_inviter"),
      translate("cancel"),
    ];
    const title = `${translate("restore")} ${group?.name}?`;
    const actions = [
      async () => {
        await group.updateConsent("allowed");
      },
      async () => {
        await group.updateConsent("allowed");
        await consentToInboxIdsOnProtocolByAccount({
          account: currentAccount,
          inboxIds: [group.addedByInboxId],
          consent: "allow",
        });
        setInboxIdPeerStatus({
          [group.addedByInboxId]: "allowed",
        });
      },
    ];
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        title,
        ...actionSheetColors(colorScheme),
      },
      async (selectedIndex?: number) => {
        if (selectedIndex !== undefined && selectedIndex < actions.length) {
          actions[selectedIndex]();
        }
      }
    );
  }, [colorScheme, currentAccount, group, setInboxIdPeerStatus]);

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
          handleDelete();
          closeContextMenu();
        },
        id: "delete",
      },
    ],
    [
      topic,
      setPinnedConversations,
      handleDelete,
      closeContextMenu,
      isUnread,
      toggleReadStatus,
    ]
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
    handleDelete,
    handleRestore,
    messageText,
  };
};

type UseUserInteractionsProps = {
  topic: ConversationTopic;
  ref: RefObject<Swipeable>;
  showContextMenu: () => void;
  toggleReadStatus: () => void;
  handleDelete: () => void;
  handleRestore: () => void;
  isBlockedChatView: boolean;
};

const useUserInteractions = ({
  topic,
  ref,
  showContextMenu,
  toggleReadStatus,
  handleDelete,
  handleRestore,
  isBlockedChatView,
}: UseUserInteractionsProps) => {
  const currentAccount = useCurrentAccount()!;
  const onPress = useCallback(() => {
    prefetchConversationMessages(currentAccount, topic);
    navigate("Conversation", {
      topic,
    });
  }, [topic, currentAccount]);

  const triggerHapticFeedback = useCallback(() => {
    return Haptics.mediumImpactAsync();
  }, []);

  const onLongPress = useCallback(() => {
    runOnJS(triggerHapticFeedback)();
    runOnJS(showContextMenu)();
  }, [triggerHapticFeedback, showContextMenu]);

  const onLeftPress = useCallback(() => {}, []);

  const onRightPress = useCallback(() => {
    if (isBlockedChatView) {
      handleRestore();
    } else {
      handleDelete();
    }
    ref.current?.close();
  }, [isBlockedChatView, handleRestore, handleDelete, ref]);

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
    handleDelete,
    handleRestore,
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
    handleDelete,
    handleRestore,
    isBlockedChatView,
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
