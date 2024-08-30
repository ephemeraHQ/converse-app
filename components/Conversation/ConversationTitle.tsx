import Clipboard from "@react-native-clipboard/clipboard";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { headerTitleStyle, textPrimaryColor } from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import { useProfilesStore } from "../../data/store/accountsStore";
import { XmtpConversation } from "../../data/store/chatStore";
import { useGroupName } from "../../hooks/useGroupName";
import { useGroupPhoto } from "../../hooks/useGroupPhoto";
import { NavigationParamList } from "../../screens/Navigation/Navigation";
import { getPreferredAvatar } from "../../utils/profile";
import { conversationName, getTitleFontScale } from "../../utils/str";
import Avatar from "../Avatar";
import { useDebugEnabled } from "../DebugButton";
import GroupAvatar from "../GroupAvatar";

type Props = {
  conversation?: XmtpConversation;
  textInputRef: MutableRefObject<TextInput | undefined>;
} & NativeStackScreenProps<NavigationParamList, "Conversation">;

export default function ConversationTitle({
  conversation,
  textInputRef,
  navigation,
}: Props) {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const { groupName } = useGroupName(conversation?.topic ?? "");
  const { groupPhoto } = useGroupPhoto(conversation?.topic ?? "");
  const [title, setTitle] = useState(
    conversation
      ? conversation.isGroup
        ? groupName
        : conversationName(conversation)
      : ""
  );
  const profiles = useProfilesStore((state) => state.profiles);
  const [avatar, setAvatar] = useState(
    conversation?.isGroup
      ? groupPhoto
      : getPreferredAvatar(
          conversation?.peerAddress
            ? profiles[conversation.peerAddress]?.socials
            : undefined
        )
  );
  const debugEnabled = useDebugEnabled();
  const conversationRef = useRef(conversation);
  useEffect(() => {
    if (!conversation) {
      conversationRef.current = conversation;
      return;
    }

    const previousConversation = conversationRef.current;
    if (
      !previousConversation ||
      conversation.peerAddress !== previousConversation.peerAddress ||
      conversation.context?.conversationId !==
        previousConversation.context?.conversationId ||
      conversation.conversationTitle ||
      (previousConversation.isGroup &&
        conversation.isGroup &&
        previousConversation.groupName !== conversation.groupName)
    ) {
      // New conversation, lets' set title
      if (!conversation.isGroup) {
        setTitle(conversationName(conversation));
      }
      if (!conversation.peerAddress) return;
      const socials = profiles[conversation.peerAddress]?.socials;
      setAvatar(getPreferredAvatar(socials));
    }
    conversationRef.current = conversation;
  }, [conversation, profiles]);

  useEffect(() => {
    if (groupName) {
      setTitle(groupName);
    }
  }, [groupName]);

  useEffect(() => {
    if (groupPhoto) {
      setAvatar(groupPhoto);
    }
  }, [groupPhoto]);

  const avatarComponent = useMemo(() => {
    if (!conversation) return null;
    return conversation?.isGroup ? (
      <GroupAvatar
        uri={avatar}
        size={AvatarSizes.conversationTitle}
        style={styles.avatar}
        topic={conversation.topic}
      />
    ) : (
      <Avatar
        uri={avatar}
        size={AvatarSizes.conversationTitle}
        style={styles.avatar}
        name={conversationName(conversation)}
      />
    );
  }, [avatar, conversation, styles.avatar]);

  const handleLongPress = useCallback(() => {
    if (!debugEnabled) return;
    Clipboard.setString(
      JSON.stringify({
        topic: conversation?.topic || "",
        context: conversation?.context,
      })
    );
    Alert.alert("Conversation details copied");
  }, [conversation?.context, conversation?.topic, debugEnabled]);

  const onPress = useCallback(() => {
    if (!conversation) return;
    // Close keyboard
    textInputRef?.current?.blur();
    if (conversation.isGroup) {
      navigation.push("Group", { topic: conversation.topic });
    } else if (conversation.peerAddress) {
      navigation.push("Profile", { address: conversation.peerAddress });
    }
  }, [conversation, navigation, textInputRef]);

  if (!conversation) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onLongPress={handleLongPress}
        onPress={onPress}
        style={styles.touchableContainer}
      >
        {avatarComponent}
        <Text
          style={{
            color: textPrimaryColor(colorScheme),
            fontSize:
              Platform.OS === "ios"
                ? 16 * getTitleFontScale()
                : headerTitleStyle(colorScheme).fontSize,
          }}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {title}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    avatar: {
      marginRight: Platform.OS === "android" ? 24 : 7,
      marginLeft: Platform.OS === "ios" ? 0 : -9,
    },
    container: { flexDirection: "row", flexGrow: 1 },
    touchableContainer: {
      flexDirection: "row",
      justifyContent: "flex-start",
      left: Platform.OS === "android" ? -36 : 0,
      width: "100%",
      alignItems: "center",
      paddingRight: 40,
    },
    title: {
      color: textPrimaryColor(colorScheme),
      fontSize:
        Platform.OS === "ios"
          ? 16 * getTitleFontScale()
          : headerTitleStyle(colorScheme).fontSize,
    },
  });
};
