import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { useConversationListGroupItem } from "@hooks/useConversationListGroupItem";
import { useProfilesSocials } from "@hooks/useProfilesSocials";
import { translate } from "@i18n/index";
import { inversePrimaryColor } from "@styles/colors";
import { AvatarSizes, PictoSizes } from "@styles/sizes";
import { saveTopicsData } from "@utils/api";
import { getMinimalDate } from "@utils/date";
import { Haptics } from "@utils/haptics";
import { navigate } from "@utils/navigation";
import { getPreferredAvatar, getPreferredName } from "@utils/profile";
import { Member } from "@xmtp/react-native-sdk";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

import Avatar from "./Avatar";
import { ConversationContextMenu } from "./ConversationContextMenu";
import { ConversationListItemDumb } from "./ConversationListItem/ConversationListItemDumb";
import { GroupAvatarDumb } from "./GroupAvatar/GroupAvatar";
import Picto from "./Picto/Picto";

type V3GroupConversationListItemProps = {
  topic: string;
};

type UseDataProps = {
  topic: string;
};

const useData = ({ topic }: UseDataProps) => {
  // TODO Items
  const timestamp = new Date().getTime();
  const isUnread = true;
  const isBlockedChatView = false;

  const currentAccount = useCurrentAccount()!;
  const { setTopicsData, setPinnedConversations } = useChatStore(
    useSelect(["setTopicsData", "setPinnedConversations"])
  );

  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const showContextMenu = useCallback(() => {
    setIsContextMenuVisible(true);
  }, []);

  const group = useConversationListGroupItem(topic);

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
  };
};

type UseUserInteractionsProps = {
  topic: string;
  showContextMenu: () => void;
  toggleReadStatus: () => void;
};

const useUserInteractions = ({
  topic,
  showContextMenu,
  toggleReadStatus,
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

  const onRightPress = useCallback(() => {}, []);

  const onLeftSwipe = useCallback(() => {}, []);

  const onRightSwipe = useCallback(() => {}, []);

  return {
    onPress,
    onLongPress,
    onLeftPress,
    onRightPress,
    onLeftSwipe,
    onRightSwipe,
  };
};

type UseDisplayInfoProps = {
  timestamp: number;
};
const useDisplayInfo = ({ timestamp }: UseDisplayInfoProps) => {
  const timeToShow = getMinimalDate(timestamp);
  const colorScheme = useColorScheme();
  return { timeToShow, colorScheme };
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
  } = useData({ topic });
  const {
    onPress,
    onLongPress,
    onLeftPress,
    onRightPress,
    onLeftSwipe,
    onRightSwipe,
  } = useUserInteractions({
    topic,
    showContextMenu,
    toggleReadStatus,
  });
  const { timeToShow, colorScheme } = useDisplayInfo({ timestamp });

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

  const renderRightActions = useCallback(() => {
    if (isBlockedChatView) {
      return (
        <RectButton onPress={onRightPress}>
          <Picto
            picto="checkmark"
            color={inversePrimaryColor(colorScheme)}
            size={PictoSizes.swipableItem}
          />
        </RectButton>
      );
    } else {
      return (
        <RectButton onPress={onRightPress}>
          <Picto picto="trash" color="white" size={PictoSizes.swipableItem} />
        </RectButton>
      );
    }
  }, [isBlockedChatView, onRightPress, colorScheme]);

  const renderLeftActions = useCallback(() => {
    return (
      <RectButton>
        <Picto
          picto={isUnread ? "checkmark.message" : "message.badge"}
          color={inversePrimaryColor(colorScheme)}
          size={PictoSizes.swipableItem}
        />
      </RectButton>
    );
  }, [isUnread, colorScheme]);

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
      onPress={onPress}
      onLongPress={onLongPress}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      onLeftSwipe={onLeftSwipe}
      selected={false}
      showError={false}
      showImagePreview={false}
      imagePreviewUrl={undefined}
      onRightSwipe={onRightSwipe}
      avatarComponent={avatarComponent}
      title={group?.name}
      subtitle={`${timeToShow} ⋅ Message exam`}
      contextMenuComponent={contextMenuComponent}
      isUnread={isUnread}
    />
  );
}
