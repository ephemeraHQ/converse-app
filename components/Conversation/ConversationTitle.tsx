import Clipboard from "@react-native-clipboard/clipboard";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
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
import { headerTitleStyle, textPrimaryColor } from "../../utils/colors";
import { getPreferredAvatar } from "../../utils/profile";
import { conversationName, getTitleFontScale } from "../../utils/str";
import Avatar from "../Avatar";
import { useEnableDebug } from "../DebugButton";
import Picto from "../Picto/Picto";

type Props = {
  isBlockedPeer: boolean;
  peerAddress?: string;
  conversation?: XmtpConversation;
  textInputRef: MutableRefObject<TextInput | undefined>;
} & NativeStackScreenProps<NavigationParamList, "Conversation">;

export default function ConversationTitle({
  isBlockedPeer,
  peerAddress,
  conversation,
  textInputRef,
  navigation,
}: Props) {
  const colorScheme = useColorScheme();
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
  const enableDebug = useEnableDebug();
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

  if (!conversation) return null;
  return (
    <View style={{ flexDirection: "row", flexGrow: 1 }}>
      <TouchableOpacity
        onLongPress={() => {
          if (!enableDebug) return;
          Clipboard.setString(
            JSON.stringify({
              topic: conversation?.topic || "",
              context: conversation?.context,
            })
          );
          Alert.alert("Conversation details copied");
        }}
        onPress={async () => {
          if (!conversation) return;
          // Close keyboard
          textInputRef?.current?.blur();
          if (conversation.isGroup) {
            navigation.push("Group", { topic: conversation.topic });
          } else if (conversation.peerAddress) {
            navigation.push("Profile", { address: conversation.peerAddress });
          }
        }}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
          alignItems: "center",
          paddingRight: 40,
          paddingLeft: 8,
        }}
      >
        <Text
          style={[
            {
              color: textPrimaryColor(colorScheme),
              fontSize:
                Platform.OS === "ios"
                  ? 14 * getTitleFontScale()
                  : headerTitleStyle(colorScheme).fontSize,
            },
          ]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {title}
        </Text>
        {avatar ? (
          <Avatar
            uri={avatar}
            size={24}
            style={{
              marginRight: Platform.OS === "android" ? 24 : 7,
              marginLeft: Platform.OS === "ios" ? 6 : -9,
            }}
          />
        ) : (
          <Picto
            picto="info.circle"
            size={16}
            color={textPrimaryColor(colorScheme)}
            style={{
              marginRight: Platform.OS === "android" ? 24 : 16,
              marginLeft: Platform.OS === "ios" ? 6 : -9,
            }}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}
