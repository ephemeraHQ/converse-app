import { DmWithCodecsType } from "@utils/xmtpRN/client";
import { ConversationListItemDumb } from "./ConversationListItem/ConversationListItemDumb";
import { useCallback, useMemo, useRef, useState } from "react";
import Avatar from "./Avatar";
import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { AvatarSizes } from "@styles/sizes";
import { getMinimalDate } from "@utils/date";
import { useColorScheme } from "react-native";
import { IIconName } from "@design-system/Icon/Icon.types";
import { ConversationContextMenu } from "./ConversationContextMenu";
import { useDmPeerInboxOnConversationList } from "@queries/useDmPeerInboxOnConversationList";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
import { usePreferredInboxAvatar } from "@hooks/usePreferredInboxAvatar";
import { navigate } from "@utils/navigation";
import { Swipeable } from "react-native-gesture-handler";
import { saveTopicsData } from "@utils/api";
import { useSelect } from "@data/store/storeHelpers";
import { Haptics } from "@utils/haptics";
import { runOnJS } from "react-native-reanimated";
import { translate } from "@i18n/index";
import { actionSheetColors } from "@styles/colors";
import { showActionSheetWithOptions } from "./StateHandlers/ActionSheetStateHandler";
import { useAppTheme } from "@theme/useAppTheme";
import { consentToInboxIdsOnProtocolByAccount } from "@utils/xmtpRN/contacts";
import { useToggleReadStatus } from "../features/conversation-list/hooks/useToggleReadStatus";
import { useMessageText } from "../features/conversation-list/hooks/useMessageText";
import { useRoute } from "@navigation/useNavigation";
import { useConversationIsUnread } from "../features/conversation-list/hooks/useMessageIsUnread";

type V3DMListItemProps = {
  conversation: DmWithCodecsType;
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

export const V3DMListItem = ({ conversation }: V3DMListItemProps) => {
  const currentAccount = useCurrentAccount()!;

  const { name: routeName } = useRoute();

  const isBlockedChatView = routeName === "Blocked";

  const { theme } = useAppTheme();

  const colorScheme = theme.isDark ? "dark" : "light";

  const topic = conversation.topic;

  const ref = useRef<Swipeable>(null);

  const { setTopicsData, setPinnedConversations } = useChatStore(
    useSelect(["setTopicsData", "setPinnedConversations"])
  );

  const { data: peer } = useDmPeerInboxOnConversationList(
    currentAccount!,
    conversation
  );

  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);

  const timestamp = conversation?.lastMessage?.sentNs ?? 0;

  const isUnread = useConversationIsUnread({
    topic,
    lastMessage: conversation.lastMessage,
    conversation: conversation,
    timestamp,
  });

  const { timeToShow, leftActionIcon } = useDisplayInfo({
    timestamp,
    isUnread,
  });

  const messageText = useMessageText(conversation.lastMessage);
  const prefferedName = usePreferredInboxName(peer);
  const avatarUri = usePreferredInboxAvatar(peer);

  const toggleReadStatus = useToggleReadStatus({
    setTopicsData,
    topic,
    isUnread,
    currentAccount,
  });

  const closeContextMenu = useCallback((openConversationOnClose = false) => {
    setIsContextMenuVisible(false);
    if (openConversationOnClose) {
      // openConversation();
    }
  }, []);

  const handleDelete = useCallback(() => {
    const options = [
      translate("delete"),
      translate("delete_and_block"),
      translate("cancel"),
    ];
    const title = `${translate("delete_chat_with")} ${prefferedName}?`;
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
        await conversation.updateConsent("denied");
        const peerInboxId = await conversation.peerInboxId();
        await consentToInboxIdsOnProtocolByAccount({
          account: currentAccount,
          inboxIds: [peerInboxId],
          consent: "deny",
        });
      },
    ];

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
    conversation,
    currentAccount,
    prefferedName,
    setTopicsData,
    topic,
  ]);

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

  const avatarComponent = useMemo(() => {
    return (
      <Avatar
        size={AvatarSizes.conversationListItem}
        uri={avatarUri}
        name={prefferedName}
        style={{ marginLeft: 16, alignSelf: "center" }}
      />
    );
  }, [avatarUri, prefferedName]);

  const contextMenuComponent = useMemo(
    () => (
      <ConversationContextMenu
        isVisible={isContextMenuVisible}
        onClose={() => setIsContextMenuVisible(false)}
        items={contextMenuItems}
        conversationTopic={topic}
      />
    ),
    [isContextMenuVisible, topic, contextMenuItems]
  );

  const onPress = useCallback(() => {
    navigate("Conversation", {
      topic: topic,
    });
  }, [topic]);

  const onLeftSwipe = useCallback(() => {
    toggleReadStatus();
  }, [toggleReadStatus]);

  const triggerHapticFeedback = useCallback(() => {
    return Haptics.mediumImpactAsync();
  }, []);

  const showContextMenu = useCallback(() => {
    setIsContextMenuVisible(true);
  }, []);

  const onLongPress = useCallback(() => {
    runOnJS(triggerHapticFeedback)();
    runOnJS(showContextMenu)();
  }, [triggerHapticFeedback, showContextMenu]);

  const onWillLeftSwipe = useCallback(() => {
    Haptics.successNotificationAsync();
  }, []);

  const onWillRightSwipe = useCallback(() => {}, []);

  const onRightSwipe = useCallback(() => {}, []);

  return (
    <ConversationListItemDumb
      ref={ref}
      onPress={onPress}
      // onRightActionPress={onRightPress}
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
      title={prefferedName}
      subtitle={`${timeToShow} ⋅ ${messageText}`}
      isUnread={false}
      contextMenuComponent={contextMenuComponent}
      rightIsDestructive={isBlockedChatView}
    />
  );
};
