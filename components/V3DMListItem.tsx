import {
  resetConversationListContextMenuStore,
  setConversationListContextMenuConversationData,
} from "@/features/conversation-list/ConversationListContextMenu.store";
import { useHandleDeleteDm } from "@/features/conversation-list/hooks/useHandleDeleteDm";
import { useDmPeerInboxId } from "@/queries/useDmPeerInbox";
import { useAppTheme } from "@/theme/useAppTheme";
import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { IIconName } from "@design-system/Icon/Icon.types";
import { usePreferredInboxAvatar } from "@hooks/usePreferredInboxAvatar";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
import { translate } from "@i18n/index";
import { useRoute } from "@navigation/useNavigation";
import { AvatarSizes } from "@styles/sizes";
import { getMinimalDate } from "@utils/date";
import { Haptics } from "@utils/haptics";
import { navigate } from "@utils/navigation";
import { DmWithCodecsType } from "@/utils/xmtpRN/client.types";
import { useCallback, useMemo, useRef } from "react";
import { useColorScheme } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { useConversationIsUnread } from "../features/conversation-list/hooks/useMessageIsUnread";
import { useMessageText } from "../features/conversation-list/hooks/useMessageText";
import { useToggleReadStatus } from "../features/conversation-list/hooks/useToggleReadStatus";
import Avatar from "./Avatar";
import { ContextMenuIcon, ContextMenuItem } from "./ContextMenuItems";
import { ConversationListItemDumb } from "./ConversationListItem/ConversationListItemDumb";
import { prefetchConversationMessages } from "@/queries/useConversationMessages";

type V3DMListItemProps = {
  conversation: DmWithCodecsType;
};

type UseDisplayInfoProps = {
  isUnread: boolean;
};
const useDisplayInfo = ({ isUnread }: UseDisplayInfoProps) => {
  const colorScheme = useColorScheme();
  const leftActionIcon: IIconName = isUnread
    ? "checkmark.message"
    : "message.badge";
  return { colorScheme, leftActionIcon };
};

export const V3DMListItem = ({ conversation }: V3DMListItemProps) => {
  const currentAccount = useCurrentAccount()!;

  const { name: routeName } = useRoute();

  const isBlockedChatView = routeName === "Blocked";

  const topic = conversation.topic;

  const ref = useRef<Swipeable>(null);

  const { setPinnedConversations } = useChatStore(
    useSelect(["setPinnedConversations"])
  );

  const { data: peerInboxId } = useDmPeerInboxId({
    account: currentAccount!,
    topic,
  });

  const timestamp = conversation?.lastMessage?.sentNs ?? 0;
  const timeToShow = getMinimalDate(timestamp);

  const isUnread = useConversationIsUnread({
    topic,
    lastMessage: conversation.lastMessage,
    timestampNs: timestamp,
  });

  const { leftActionIcon } = useDisplayInfo({
    isUnread,
  });

  const { theme } = useAppTheme();

  const messageText = useMessageText(conversation.lastMessage);
  const preferredName = usePreferredInboxName(peerInboxId);
  const avatarUri = usePreferredInboxAvatar(peerInboxId);

  const toggleReadStatus = useToggleReadStatus({
    topic,
    isUnread,
    currentAccount,
  });

  const handleDelete = useHandleDeleteDm({
    topic,
    preferredName,
    conversation,
  });

  const closeContextMenu = useCallback(() => {
    resetConversationListContextMenuStore();
  }, []);

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
      closeContextMenu,
      toggleReadStatus,
      handleDelete,
    ]
  );

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

  const onLeftSwipe = useCallback(() => {
    const translation = ref.current?.state.rowTranslation;
    if (translation && (translation as any)._value > 100) {
      toggleReadStatus();
    }
  }, [toggleReadStatus, ref]);

  const triggerHapticFeedback = useCallback(() => {
    return Haptics.mediumImpactAsync();
  }, []);

  const showContextMenu = useCallback(() => {
    setConversationListContextMenuConversationData(topic, contextMenuItems);
  }, [contextMenuItems, topic]);

  const onLongPress = useCallback(() => {
    runOnJS(triggerHapticFeedback)();
    runOnJS(showContextMenu)();
  }, [triggerHapticFeedback, showContextMenu]);

  const onWillLeftSwipe = useCallback(() => {
    Haptics.successNotificationAsync();
  }, []);

  const onWillRightSwipe = useCallback(() => {}, []);

  const onRightSwipe = useCallback(() => {}, []);

  const subtitle =
    timeToShow && messageText ? `${timeToShow} ⋅ ${messageText}` : "";

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
      title={preferredName}
      subtitle={subtitle}
      isUnread={isUnread}
      rightIsDestructive={isBlockedChatView}
    />
  );
};
