import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { useConversationListGroupItem } from "@hooks/useConversationListGroupItem";
import { useProfilesSocials } from "@hooks/useProfilesSocials";
import { translate } from "@i18n/index";
import { AvatarSizes } from "@styles/sizes";
import { saveTopicsData } from "@utils/api";
import { getMinimalDate } from "@utils/date";
import { groupRemoveRestoreHandler } from "@utils/groupUtils/groupActionHandlers";
import { Haptics } from "@utils/haptics";
import { navigate } from "@utils/navigation";
import { getPreferredAvatar, getPreferredName } from "@utils/profile";
import { Member } from "@xmtp/react-native-sdk";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

import Avatar from "./Avatar";
import { ConversationContextMenu } from "./ConversationContextMenu";
import { ConversationListItemDumb } from "./ConversationListItem/ConversationListItemDumb";
import { GroupAvatarDumb } from "./GroupAvatar";

type V3GroupConversationListItemProps = {
  topic: string;
};

type UseDataProps = {
  topic: string;
};

const useData = ({ topic }: UseDataProps) => {
  // TODO Items
  const timestamp = new Date(2024, 9, 10).getTime();
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

  const group = useConversationListGroupItem(topic);

  const isUnread = useMemo(() => {
    if (!group) return false;
    // if (!group.message) return false;
    if (topicsData[topic]?.status === "unread") {
      return true;
    }
    // if (message.from === currentAccount) return false;
    const readUntil = topicsData[topic]?.readUntil || 0;
    return readUntil < timestamp;
  }, [topicsData, topic, timestamp, group]);

  const [members, setMembers] = useState<Member[]>([]);
  const memberAddresses = useMemo(() => {
    const addresses: string[] = [];
    for (const member of members) {
      if (member.addresses[0].toLowerCase() !== currentAccount?.toLowerCase()) {
        addresses.push(member.addresses[0]);
      }
    }
    return addresses;
  }, [members, currentAccount]);

  const data = useProfilesSocials(memberAddresses);
  useEffect(() => {
    if (group?.imageUrlSquare) {
      return;
    }
    const fetchMembers = async () => {
      const members = await group?.membersList();
      setMembers(members || []);
    };
    fetchMembers();
  }, [group]);

  const memberData: {
    address: string;
    uri?: string;
    name?: string;
  }[] = useMemo(() => {
    return data.map(({ data: socials }, index) =>
      socials
        ? {
            address: memberAddresses[index],
            uri: getPreferredAvatar(socials),
            name: getPreferredName(socials, memberAddresses[index]),
          }
        : {
            address: memberAddresses[index],
            uri: undefined,
            name: memberAddresses[index],
          }
    );
  }, [data, memberAddresses]);

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
    navigate("Conversation", { topic });
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
  const leftActionPicto = isUnread ? "checkmark.message" : "message.badge";
  return { timeToShow, colorScheme, leftActionPicto };
};

export function V3GroupConversationListItem({
  topic,
}: V3GroupConversationListItemProps) {
  const {
    group,
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
  } = useData({ topic });
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
    topic,
    showContextMenu,
    toggleReadStatus,
    handleRemoveRestore,
  });
  const { timeToShow, leftActionPicto } = useDisplayInfo({
    timestamp,
    isUnread,
  });

  const contextMenuComponent = useMemo(
    () => (
      <ConversationContextMenu
        isVisible={isContextMenuVisible}
        onClose={closeContextMenu}
        items={contextMenuItems}
        conversationTopic={topic}
      />
    ),
    [isContextMenuVisible, closeContextMenu, contextMenuItems, topic]
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
      leftActionPicto={leftActionPicto}
      showError={false}
      showImagePreview={false}
      imagePreviewUrl={undefined}
      avatarComponent={avatarComponent}
      title={group?.name}
      subtitle={`${timeToShow} ⋅ Message exam`}
      contextMenuComponent={contextMenuComponent}
      isUnread={isUnread}
      rightIsDestructive={isBlockedChatView}
    />
  );
}
