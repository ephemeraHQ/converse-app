import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { MutableRefObject, useContext } from "react";
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
import { headerTitleStyle } from "../../utils/colors";
import { conversationName, getTitleFontScale } from "../../utils/str";
import Connecting, { shouldShowConnectingOrSyncing } from "../Connecting";
import { shouldShowDebug } from "../DebugButton";

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
            {conversation ? conversationName(conversation) : ""}
          </Text>
        </TouchableOpacity>
      )}
      {shouldShowConnectingOrSyncing(state) && <Connecting />}
    </>
  );
}
