import { useSelect } from "@data/store/storeHelpers";
import {
  useChatStore,
  useCurrentAccount,
  useProfilesStore,
} from "@features/accounts/accounts.store";
import { useGroupNameQuery } from "@queries/useGroupNameQuery";
import { useGroupPhotoQuery } from "@queries/useGroupPhotoQuery";
import { backgroundColor, textSecondaryColor } from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import { ConversationWithLastMessagePreview } from "@utils/conversation";
import { showUnreadOnConversation } from "@utils/conversation/showUnreadOnConversation";
import { conversationName } from "@utils/str";
import { FC, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

import Avatar from "..//Avatar";
import { navigate } from "../../utils/navigation";
import {
  getPreferredAvatar,
  getPreferredName,
  getProfile,
} from "../../utils/profile";
import GroupAvatar from "../GroupAvatar";

interface Props {
  conversation: ConversationWithLastMessagePreview;
}

export const PinnedConversation: FC<Props> = ({ conversation }) => {
  const account = useCurrentAccount() as string;
  const profiles = useProfilesStore((s) => s.profiles);
  const { topic, isGroup } = conversation;
  const { data: groupName } = useGroupNameQuery(account, topic, {
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const { data: groupPhoto } = useGroupPhotoQuery(account, topic, {
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const title = isGroup ? groupName : conversationName(conversation);
  const socials = getProfile(conversation.peerAddress, profiles)?.socials;
  const avatar = isGroup ? groupPhoto : getPreferredAvatar(socials);
  const setPinnedConversations = useChatStore((s) => s.setPinnedConversations);
  const styles = useStyles();

  const onPress = useCallback(() => {
    navigate("Conversation", {
      topic: conversation.topic,
    });
  }, [conversation.topic]);

  const onLongPress = useCallback(() => {
    setPinnedConversations([conversation.topic]);
  }, [conversation.topic, setPinnedConversations]);
  const { initialLoadDoneOnce, topicsData } = useChatStore(
    useSelect(["initialLoadDoneOnce", "topicsData"])
  );

  const showUnread = useMemo(
    () =>
      showUnreadOnConversation(
        initialLoadDoneOnce,
        conversation.lastMessagePreview,
        topicsData,
        conversation,
        account
      ),
    [account, conversation, initialLoadDoneOnce, topicsData]
  );

  const avatarComponent = isGroup ? (
    <GroupAvatar
      key={conversation.topic}
      uri={avatar}
      size={AvatarSizes.pinnedConversation}
      style={styles.avatar}
      topic={conversation.topic}
      showIndicator={showUnread}
    />
  ) : (
    <Avatar
      key={conversation.topic}
      uri={avatar}
      size={AvatarSizes.pinnedConversation}
      style={styles.avatar}
      name={getPreferredName(socials, conversation.peerAddress || "")}
      showIndicator={showUnread}
    />
  );

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {avatarComponent}
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
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
