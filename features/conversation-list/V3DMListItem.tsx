import { prefetchConversationMessages } from "@/queries/useConversationMessages";
import { useDmPeerInboxId } from "@/queries/useDmPeerInbox";
import { useAppTheme } from "@/theme/useAppTheme";
import { DmWithCodecsType } from "@/utils/xmtpRN/client.types";
import { useCurrentAccount } from "@data/store/accountsStore";
import { IIconName } from "@design-system/Icon/Icon.types";
import { usePreferredInboxAvatar } from "@hooks/usePreferredInboxAvatar";
import { usePreferredInboxName } from "@hooks/usePreferredInboxName";
import { useRoute } from "@navigation/useNavigation";
import { getMinimalDate } from "@utils/date";
import { Haptics } from "@utils/haptics";
import { navigate } from "@utils/navigation";
import { useCallback, useMemo, useRef } from "react";
import { useColorScheme } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Avatar from "../../components/Avatar";
import { ConversationListItemDumb } from "./components/conversation-list-item";
import { useConversationIsUnread } from "./hooks/useMessageIsUnread";
import { useMessageText } from "./hooks/useMessageText";
import { useToggleReadStatus } from "./hooks/useToggleReadStatus";

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
