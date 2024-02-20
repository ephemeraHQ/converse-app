import Clipboard from "@react-native-clipboard/clipboard";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import {
  TouchableOpacity,
  Platform,
  useColorScheme,
  Text,
  Alert,
  TextInput,
} from "react-native";

import { XmtpConversation } from "../../data/store/chatStore";
import { NavigationParamList } from "../../screens/Navigation/Navigation";
import { headerTitleStyle, textSecondaryColor } from "../../utils/colors";
import { conversationName, getTitleFontScale } from "../../utils/str";
import Connecting, { useShouldShowConnectingOrSyncing } from "../Connecting";
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
  const [title, setTitle] = useState(
    conversation ? conversationName(conversation) : ""
  );
  const enableDebug = useEnableDebug();
  const shouldShowConnectingOrSyncing = useShouldShowConnectingOrSyncing();
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
      conversation.conversationTitle
    ) {
      // New conversation, lets' set title
      setTitle(conversationName(conversation));
    }
    conversationRef.current = conversation;
  }, [conversation]);
  if (!conversation) return null;
  return (
    <>
      {!shouldShowConnectingOrSyncing && (
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
        >
          <Text
            style={[
              headerTitleStyle(colorScheme),
              {
                fontSize:
                  Platform.OS === "ios"
                    ? 17 * getTitleFontScale()
                    : headerTitleStyle(colorScheme).fontSize,
              },
            ]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {title}
          </Text>
          <Picto
            picto="chevron.right"
            size={Platform.OS === "ios" ? 8 : 16}
            style={{
              position: "absolute",
              ...Platform.select({
                default: { right: -8, bottom: 9.5 },
                android: { right: -3, bottom: 3 },
                web: {
                  right: -23,
                  bottom: -3,
                },
              }),
            }}
            color={textSecondaryColor(colorScheme)}
          />
        </TouchableOpacity>
      )}
      {shouldShowConnectingOrSyncing && <Connecting />}
    </>
  );
}
