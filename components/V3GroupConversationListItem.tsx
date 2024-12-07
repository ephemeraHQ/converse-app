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
import { RefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { useColorScheme } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

import Avatar from "./Avatar";
import { ConversationListItemDumb } from "./ConversationListItem/ConversationListItemDumb";
import { GroupAvatarDumb } from "./GroupAvatar";
import { useGroupConversationListAvatarInfo } from "../features/conversation-list/useGroupConversationListAvatarInfo";
import { IIconName } from "@design-system/Icon/Icon.types";
import { GroupWithCodecsType } from "@utils/xmtpRN/client";
import { useRoute } from "@navigation/useNavigation";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";
import { actionSheetColors } from "@styles/colors";
import { consentToInboxIdsOnProtocolByAccount } from "@utils/xmtpRN/contacts";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { prefetchConversationMessages } from "@queries/useConversationMessages";
import { useToggleReadStatus } from "../features/conversation-list/hooks/useToggleReadStatus";
import { useMessageText } from "../features/conversation-list/hooks/useMessageText";
import { useConversationIsUnread } from "../features/conversation-list/hooks/useMessageIsUnread";
import {
  resetConversationListContextMenuStore,
  setConversationListContextMenuConversationData,
} from "@/features/conversation-list/ConversationListContextMenu.store";
import { ContextMenuIcon, ContextMenuItem } from "./ContextMenuItems";
import { useAppTheme } from "@/theme/useAppTheme";

type V3GroupConversationListItemProps = {
  group: GroupWithCodecsType;
};

type UseDataProps = {
  group: GroupWithCodecsType;
};

const closeContextMenu = () => {
  resetConversationListContextMenuStore();
};

const useData = ({ group }: UseDataProps) => {
  const { name: routeName } = useRoute();

  const isBlockedChatView = routeName === "Blocked";

  const colorScheme = useColorScheme();

  const currentAccount = useCurrentAccount()!;

  const { setTopicsData, setPinnedConversations } = useChatStore(
    useSelect(["setTopicsData", "setPinnedConversations"])
  );

  const topic = group?.topic;
  const { theme } = useAppTheme();
  const timestamp = group?.lastMessage?.sentNs ?? 0;

  const isUnread = useConversationIsUnread({
    topic,
    lastMessage: group.lastMessage,
    timestamp,
  });

  const { memberData } = useGroupConversationListAvatarInfo(
    currentAccount,
    group
  );

  const toggleReadStatus = useToggleReadStatus({
    topic,
    isUnread,
    currentAccount,
  });

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

  const contextMenuItems: ContextMenuItem[] = useMemo(
    () => [
      {
        title: translate("pin"),
        action: () => {
          setPinnedConversations([topic]);
          closeContextMenu();
        },
        id: "pin",
        rightView: <ContextMenuIcon icon="pin" />,
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
        rightView: (
          <ContextMenuIcon
            icon={isUnread ? "checkmark.message" : "message.badge"}
          />
        ),
      },
      {
        title: translate("delete"),
        action: () => {
          handleDelete();
          closeContextMenu();
        },
        id: "delete",
        titleStyle: {
          color: theme.colors.global.caution,
        },
        rightView: (
          <ContextMenuIcon icon="trash" color={theme.colors.global.caution} />
        ),
      },
    ],
    [
      isUnread,
      theme.colors.global.caution,
      setPinnedConversations,
      topic,
      toggleReadStatus,
      handleDelete,
    ]
  );

  const showContextMenu = useCallback(() => {
    setConversationListContextMenuConversationData(
      group.topic,
      contextMenuItems
    );
  }, [contextMenuItems, group.topic]);

  const messageText = useMessageText(group.lastMessage);

  return {
    group,
    memberData,
    timestamp,
    contextMenuItems,
    showContextMenu,
    toggleReadStatus,
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
    const translation = ref.current?.state.rowTranslation;
    if (translation && (translation as any)._value > 100) {
      toggleReadStatus();
    }
  }, [ref, toggleReadStatus]);

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
    showContextMenu,
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
      isUnread={isUnread}
      rightIsDestructive={isBlockedChatView}
    />
  );
}
