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
  const { state, dispatch } = useContext(AppContext);
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
            // showActionSheetWithOptions(
            //   {
            //     options: [
            //       "Copy wallet address",
            //       isBlockedPeer ? "Unblock" : "Block",
            //       "Cancel",
            //     ],
            //     cancelButtonIndex: 2,
            //     title: peerAddress,
            //     destructiveButtonIndex: isBlockedPeer ? undefined : 1,
            //     ...actionSheetColors(colorScheme),
            //   },
            //   (selectedIndex?: number) => {
            //     switch (selectedIndex) {
            //       case 0:
            //         Clipboard.setStringAsync(peerAddress || "");
            //         break;
            //       case 1:
            //         showActionSheetWithOptions(
            //           {
            //             options: [
            //               isBlockedPeer ? "Unblock" : "Block",
            //               "Cancel",
            //             ],
            //             cancelButtonIndex: 1,
            //             destructiveButtonIndex: isBlockedPeer ? undefined : 0,
            //             title: isBlockedPeer
            //               ? "If you unblock this contact, they will be able to send you messages again."
            //               : "If you block this contact, you will not receive messages from them anymore.",
            //             ...actionSheetColors(colorScheme),
            //           },
            //           (selectedIndex?: number) => {
            //             if (selectedIndex === 0) {
            //               blockPeer({
            //                 peerAddress: peerAddress || "",
            //                 blocked: !isBlockedPeer,
            //               });
            //               dispatch({
            //                 type: XmtpDispatchTypes.XmtpSetBlockedStatus,
            //                 payload: {
            //                   peerAddress: peerAddress || "",
            //                   blocked: !isBlockedPeer,
            //                 },
            //               });
            //             }
            //           }
            //         );
            //         break;
            //       default:
            //         break;
            //     }
            //   }
            // );
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
