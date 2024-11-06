import { DmWithCodecsType } from "@utils/xmtpRN/client";
import { ConversationListItemDumb } from "./ConversationListItem/ConversationListItemDumb";
import { useMemo, useState } from "react";
import { getMessageContentType } from "@utils/xmtpRN/contentTypes";
import logger from "@utils/logger";
import Avatar from "./Avatar";
import { useProfilesStore } from "@data/store/accountsStore";
import { AvatarSizes } from "@styles/sizes";
import { getPreferredAvatar, getPreferredName } from "@utils/profile";
import { getMinimalDate } from "@utils/date";
import { useColorScheme } from "react-native";
import { IIconName } from "@design-system/Icon/Icon.types";
import { ConversationContextMenu } from "./ConversationContextMenu";

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
  const peer = conversation.peerAddress;
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);
  const peerProfile = useProfilesStore((state) => state.profiles[peer]);
  const { timeToShow, colorScheme, leftActionIcon } = useDisplayInfo({
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

  const prefferedName = getPreferredName(peerProfile?.socials, peer);

  const avatarComponent = useMemo(() => {
    return (
      <Avatar
        size={AvatarSizes.conversationListItem}
        uri={getPreferredAvatar(peerProfile?.socials)}
        name={prefferedName}
        style={{ marginLeft: 16, alignSelf: "center" }}
      />
    );
  }, [peerProfile?.socials, prefferedName]);

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

  return (
    <ConversationListItemDumb
      // ref={ref}
      // onPress={onPress}
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
