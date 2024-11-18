import { DmWithCodecsType } from "@utils/xmtpRN/client";
import { ConversationListItemDumb } from "./ConversationListItem/ConversationListItemDumb";
import { useCallback, useMemo, useRef, useState } from "react";
import { getMessageContentType } from "@utils/xmtpRN/contentTypes";
import logger from "@utils/logger";
import Avatar from "./Avatar";
import { useCurrentAccount } from "@data/store/accountsStore";
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
  const currentAccount = useCurrentAccount();
  const { data: peer } = useDmPeerInboxOnConversationList(
    currentAccount!,
    conversation
  );
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const { timeToShow, leftActionIcon } = useDisplayInfo({
    timestamp: conversation.createdAt,
    isUnread: false,
  });

  const messageText = useMemo(() => {
    const lastMessage = conversation?.lastMessage;
    if (!lastMessage) return "";
    try {
      const content = conversation?.lastMessage?.content();
      const contentType = getMessageContentType(lastMessage.contentTypeId);
      if (contentType === "conversationUpdated") {
        //  TODO: Update this
        return "conversation updated";
      }
      if (typeof content === "string") {
        return content;
      }
      return conversation?.lastMessage?.fallback;
    } catch (e) {
      logger.error("Error getting message text", {
        error: e,
        contentTypeId: lastMessage?.contentTypeId,
      });
      return conversation?.lastMessage?.fallback;
    }
  }, [conversation?.lastMessage]);

  const prefferedName = usePreferredInboxName(peer);
  const avatarUri = usePreferredInboxAvatar(peer);

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
        items={[]}
        conversationTopic={conversation.topic}
      />
    ),
    [isContextMenuVisible, conversation.topic]
  );
  const ref = useRef<Swipeable>(null);
  const onPress = useCallback(() => {
    navigate("Conversation", {
      topic: conversation.topic,
    });
  }, [conversation.topic]);

  return (
    <ConversationListItemDumb
      ref={ref}
      onPress={onPress}
      // onRightActionPress={onRightPress}
      // onLongPress={onLongPress}
      // onRightSwipe={onRightSwipe}
      // onLeftSwipe={onLeftSwipe}
      // onWillRightSwipe={onWillRightSwipe}
      // onWillLeftSwipe={onWillLeftSwipe}
      leftActionIcon={leftActionIcon}
      showError={false}
      showImagePreview={false}
      imagePreviewUrl={undefined}
      avatarComponent={avatarComponent}
      title={prefferedName}
      subtitle={`${timeToShow} ⋅ ${messageText}`}
      isUnread={false}
      contextMenuComponent={contextMenuComponent}
      // rightIsDestructive={isBlockedChatView}
    />
  );
};
