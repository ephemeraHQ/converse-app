import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import {
  MutableRefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  TouchableOpacity,
  Platform,
  useColorScheme,
  Text,
  Alert,
  TextInput,
} from "react-native";

import { AppContext } from "../../data/store/context";
import { XmtpConversation } from "../../data/store/xmtpReducer";
import { NavigationParamList } from "../../screens/Main";
import { headerTitleStyle, textSecondaryColor } from "../../utils/colors";
import { conversationName, getTitleFontScale } from "../../utils/str";
import Connecting, { shouldShowConnectingOrSyncing } from "../Connecting";
import { shouldShowDebug } from "../DebugButton";
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
  const { state } = useContext(AppContext);
  const colorScheme = useColorScheme();
  const [title, setTitle] = useState(
    conversation ? conversationName(conversation) : ""
  );
  const conversationRef = useRef(conversation);
  useEffect(() => {
    if (!conversation || !conversationRef.current) return;
    // If it's the same conversation (from pending to real) - we keep the title
    if (
      conversation.peerAddress === conversationRef.current.peerAddress &&
      conversation.context?.conversationId ===
        conversationRef.current.context?.conversationId
    ) {
      return;
    }
    setTitle(conversationName(conversation));
    conversationRef.current = conversation;
  }, [conversation]);
  return (
    <>
      {!shouldShowConnectingOrSyncing(state) && (
        <TouchableOpacity
          onLongPress={() => {
            if (!shouldShowDebug(state)) return;
            Clipboard.setStringAsync(
              JSON.stringify({
                topic: conversation?.topic || "",
                context: conversation?.context,
              })
            );
            Alert.alert("Conversation details copied");
          }}
          onPress={async () => {
            const address = conversation?.peerAddress;
            if (!address) return;
            // Close keyboard
            textInputRef?.current?.blur();
            navigation.push("Profile", { address });
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
            size={Platform.OS === "android" ? 16 : 8}
            style={{
              position: "absolute",
              ...Platform.select({
                default: { right: -8, bottom: 9.5 },
                android: { right: -3, bottom: 3 },
              }),
            }}
            color={textSecondaryColor(colorScheme)}
          />
        </TouchableOpacity>
      )}
      {shouldShowConnectingOrSyncing(state) && <Connecting />}
    </>
  );
}
