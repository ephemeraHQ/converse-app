import { backgroundColor, textSecondaryColor } from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import { FC, useCallback } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
} from "react-native";

import { useChatStore, useProfilesStore } from "../../data/store/accountsStore";
import { XmtpConversation } from "../../data/store/chatStore";
import { useGroupName } from "../../hooks/useGroupName";
import { useGroupPhoto } from "../../hooks/useGroupPhoto";
import { navigate } from "../../utils/navigation";
import { getPreferredAvatar, getPreferredName } from "../../utils/profile";
import Avatar from "../Avatar";
interface Props {
  conversation: XmtpConversation;
}

export const PinnedConversation: FC<Props> = ({ conversation }) => {
  const profiles = useProfilesStore((s) => s.profiles);
  const { topic, isGroup } = conversation;
  const { groupName } = useGroupName(topic);
  const { groupPhoto } = useGroupPhoto(topic);
  const title = isGroup ? groupName : conversation.conversationTitle;
  const socials = profiles[conversation.peerAddress as string]?.socials;
  const avatar = isGroup ? groupPhoto : getPreferredAvatar(socials);
  const setPinnedConversations = useChatStore((s) => s.setPinnedConversations);
  const styles = useStyles();

  const onPress = useCallback(() => {
    navigate("Conversation", {
      topic: conversation.topic,
    });
  }, [conversation.topic]);

  const onLongPress = useCallback(() => {
    setPinnedConversations([conversation]);
  }, [conversation, setPinnedConversations]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Avatar
        key={conversation.topic}
        uri={avatar}
        size={AvatarSizes.pinnedConversation}
        style={styles.avatar}
        name={getPreferredName(socials, conversation.peerAddress || "")}
      />
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
