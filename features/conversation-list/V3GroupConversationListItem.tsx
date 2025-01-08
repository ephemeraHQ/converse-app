import { useAppTheme } from "@/theme/useAppTheme";
import { GroupWithCodecsType } from "@/utils/xmtpRN/client.types";
import { useCurrentAccount, useSettingsStore } from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { IIconName } from "@design-system/Icon/Icon.types";
import { translate } from "@i18n/index";
import { useRoute } from "@navigation/useNavigation";
import { prefetchConversationMessages } from "@queries/useConversationMessages";
import { actionSheetColors } from "@styles/colors";
import { getMinimalDate } from "@utils/date";
import { Haptics } from "@utils/haptics";
import { navigate } from "@utils/navigation";
import { consentToInboxIdsOnProtocolByAccount } from "@utils/xmtpRN/contacts";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { RefObject, useCallback, useMemo, useRef } from "react";
import { useColorScheme } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import Avatar from "../../components/Avatar";
import { GroupAvatarDumb } from "../../components/GroupAvatar";
import { showActionSheetWithOptions } from "../../components/StateHandlers/ActionSheetStateHandler";
import { ConversationListItemDumb } from "./components/conversation-list-item";
import { useConversationIsUnread } from "./hooks/useMessageIsUnread";
import { useMessageText } from "./hooks/useMessageText";
import { useToggleReadStatus } from "./hooks/useToggleReadStatus";
import { useGroupConversationListAvatarInfo } from "./useGroupConversationListAvatarInfo";

type V3GroupConversationListItemProps = {
  group: GroupWithCodecsType;
};

type UseDataProps = {
  group: GroupWithCodecsType;
};

const useData = ({ group }: UseDataProps) => {
  const { name: routeName } = useRoute();

  const isBlockedChatView = routeName === "Blocked";

  const colorScheme = useColorScheme();

  const currentAccount = useCurrentAccount()!;

  const topic = group?.topic;

  const timestamp = group?.lastMessage?.sentNs ?? 0;

  const isUnread = useConversationIsUnread({
    topic,
    lastMessage: group.lastMessage,
    timestampNs: timestamp,
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

  const messageText = useMessageText(group.lastMessage);

  return {
    group,
    memberData,
    timestamp,
    toggleReadStatus,
    isUnread,
    isBlockedChatView,
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
    isUnread,
    isBlockedChatView,
    toggleReadStatus,
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
    toggleReadStatus,
    handleRestore,
    isBlockedChatView,
  });

  const { theme } = useAppTheme();

  const { timeToShow, leftActionIcon } = useDisplayInfo({
    timestamp,
    isUnread,
  });

  const avatarComponent = useMemo(() => {
    return group?.imageUrlSquare ? (
      <Avatar size={theme.avatarSize.lg} uri={group?.imageUrlSquare} />
    ) : (
      <GroupAvatarDumb size={theme.avatarSize.lg} members={memberData} />
    );
  }, [group?.imageUrlSquare, memberData, theme]);

  const subtitle =
    timeToShow && messageText ? `${timeToShow} ⋅ ${messageText}` : "";

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
      subtitle={subtitle}
      isUnread={isUnread}
      rightIsDestructive={isBlockedChatView}
    />
  );
}
