import { DmWithCodecsType } from "@utils/xmtpRN/client";
import { ConversationListItemDumb } from "./ConversationListItem/ConversationListItemDumb";
import { useCallback, useMemo, useRef } from "react";
import Avatar from "./Avatar";
import { useChatStore, useCurrentAccount } from "@data/store/accountsStore";
import { AvatarSizes } from "@styles/sizes";
import { getMinimalDate } from "@utils/date";
import { useColorScheme } from "react-native";
import { IIconName } from "@design-system/Icon/Icon.types";
import { useDmPeerInboxOnConversationList } from "@queries/useDmPeerInboxOnConversationList";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
import { usePreferredInboxAvatar } from "@hooks/usePreferredInboxAvatar";
import { navigate } from "@utils/navigation";
import { Swipeable } from "react-native-gesture-handler";
import { useSelect } from "@data/store/storeHelpers";
import { Haptics } from "@utils/haptics";
import { runOnJS } from "react-native-reanimated";
import { translate } from "@i18n/index";
import { useToggleReadStatus } from "../features/conversation-list/hooks/useToggleReadStatus";
import { useMessageText } from "../features/conversation-list/hooks/useMessageText";
import { useRoute } from "@navigation/useNavigation";
import { useConversationIsUnread } from "../features/conversation-list/hooks/useMessageIsUnread";
import {
  resetConversationListContextMenuStore,
  setConversationListContextMenuConversationData,
} from "@/features/conversation-list/ConversationListContextMenu.store";
import { useHandleDeleteDm } from "@/features/conversation-list/hooks/useHandleDeleteDm";

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

  const { data: peer } = useDmPeerInboxOnConversationList(
    currentAccount!,
    conversation
  );

  const timestamp = conversation?.lastMessage?.sentNs ?? 0;
  const timeToShow = getMinimalDate(timestamp);

  const isUnread = useConversationIsUnread({
    topic,
    lastMessage: conversation.lastMessage,
    conversation: conversation,
    timestamp,
  });

  const { leftActionIcon } = useDisplayInfo({
    isUnread,
  });

  const messageText = useMessageText(conversation.lastMessage);
  const preferredName = usePreferredInboxName(peer);
  const avatarUri = usePreferredInboxAvatar(peer);

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
        name={preferredName}
        style={{ marginLeft: 16, alignSelf: "center" }}
      />
    );
  }, [avatarUri, preferredName]);

  const onPress = useCallback(() => {
    navigate("Conversation", {
      topic: topic,
    });
  }, [topic]);

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
      subtitle={`${timeToShow} ⋅ ${messageText}`}
      isUnread={isUnread}
      rightIsDestructive={isBlockedChatView}
    />
  );
};
