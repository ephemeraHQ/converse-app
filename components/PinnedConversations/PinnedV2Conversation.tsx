import { useSelect } from "@data/store/storeHelpers";
import { backgroundColor, textSecondaryColor } from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import { showUnreadOnConversation } from "@utils/conversation/showUnreadOnConversation";
import { conversationName } from "@utils/str";
import { FC, useCallback, useMemo } from "react";
import { StyleSheet, useColorScheme } from "react-native";

import Avatar from "../Avatar";
import {
  useChatStore,
  useCurrentAccount,
  useProfilesStore,
} from "../../data/store/accountsStore";
import { navigate } from "../../utils/navigation";
import {
  getPreferredAvatar,
  getPreferredName,
  getProfile,
} from "../../utils/profile";
import { useShallow } from "zustand/react/shallow";
import { usePinnedConversationLongPress } from "../../features/conversation-list/usePinnedConversationLongPress";
import { PinnedConversation } from "./PinnedConversation";

interface Props {
  topic: string;
}

export const PinnedV2Conversation: FC<Props> = ({ topic }) => {
  const account = useCurrentAccount() as string;
  const profiles = useProfilesStore((s) => s.profiles);
  const conversation = useChatStore(useShallow((s) => s.conversations[topic]));
  const title = conversationName(conversation);
  const socials = getProfile(conversation.peerAddress, profiles)?.socials;
  const avatar = getPreferredAvatar(socials);
  const styles = useStyles();

  const onPress = useCallback(() => {
    navigate("Conversation", {
      topic: conversation.topic,
    });
  }, [conversation.topic]);

  const onLongPress = usePinnedConversationLongPress(conversation.topic);
  const { initialLoadDoneOnce, topicsData } = useChatStore(
    useSelect(["initialLoadDoneOnce", "topicsData"])
  );

  const showUnread = useMemo(
    () =>
      showUnreadOnConversation(
        initialLoadDoneOnce,
        undefined,
        topicsData,
        conversation,
        account
      ),
    [account, conversation, initialLoadDoneOnce, topicsData]
  );

  const avatarComponent = useMemo(
    () => (
      <Avatar
        key={conversation.topic}
        uri={avatar}
        size={AvatarSizes.pinnedConversation}
        style={styles.avatar}
        name={getPreferredName(socials, conversation.peerAddress || "")}
        showIndicator={showUnread}
      />
    ),
    [
      conversation.topic,
      conversation.peerAddress,
      avatar,
      styles.avatar,
      socials,
      showUnread,
    ]
  );

  return (
    <PinnedConversation
      avatarComponent={avatarComponent}
      onLongPress={onLongPress}
      onPress={onPress}
      showUnread={showUnread}
      title={title}
    />
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
    container: {
      margin: 8,
      padding: 4,
    },
    avatar: { margin: 8 },
    text: {
      color: textSecondaryColor(colorScheme),
      textAlign: "center",
      flexWrap: "wrap",
      maxWidth: 100,
    },
  });
};
