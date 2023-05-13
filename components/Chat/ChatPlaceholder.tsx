import { useContext } from "react";
import {
  ColorSchemeName,
  useColorScheme,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";

import { AppContext } from "../../data/store/context";
import {
  XmtpConversationWithUpdate,
  XmtpDispatchTypes,
} from "../../data/store/xmtpReducer";
import { blockPeer } from "../../utils/api";
import { actionSheetColors, textPrimaryColor } from "../../utils/colors";
import { conversationName } from "../../utils/str";
import ActivityIndicator from "../ActivityIndicator/ActivityIndicator";
import Button from "../Button/Button";
import { showActionSheetWithOptions } from "../StateHandlers/ActionSheetStateHandler";

type Props = {
  conversation?: XmtpConversationWithUpdate;
  sendMessage: (content: string) => Promise<void>;
  isBlockedPeer: boolean;
  messagesCount: number;
  onReadyToFocus: () => void;
};

export default function ChatPlaceholder({
  isBlockedPeer,
  conversation,
  messagesCount,
  sendMessage,
  onReadyToFocus,
}: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const { dispatch } = useContext(AppContext);
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
      }}
    >
      <View
        onLayout={() => {
          if (conversation && !isBlockedPeer && messagesCount === 0) {
            onReadyToFocus();
          }
        }}
        style={styles.chatPlaceholder}
      >
        {!conversation && (
          <View>
            <ActivityIndicator style={{ marginBottom: 20 }} />
            <Text style={styles.chatPlaceholderText}>
              Opening your conversation
            </Text>
          </View>
        )}
        {conversation && isBlockedPeer && (
          <View>
            <Text style={styles.chatPlaceholderText}>This user is blocked</Text>
            <Button
              variant="primary"
              picto="lock.open"
              title="Unblock"
              style={styles.cta}
              onPress={() => {
                showActionSheetWithOptions(
                  {
                    options: ["Unblock", "Cancel"],
                    cancelButtonIndex: 1,
                    destructiveButtonIndex: isBlockedPeer ? undefined : 0,
                    title:
                      "If you unblock this contact, they will be able to send you messages again.",
                    ...actionSheetColors(colorScheme),
                  },
                  (selectedIndex?: number) => {
                    if (selectedIndex === 0) {
                      blockPeer({
                        peerAddress: conversation?.peerAddress || "",
                        blocked: false,
                      });
                      dispatch({
                        type: XmtpDispatchTypes.XmtpSetBlockedStatus,
                        payload: {
                          peerAddress: conversation?.peerAddress || "",
                          blocked: false,
                        },
                      });
                    }
                  }
                );
              }}
            />
          </View>
        )}
        {conversation && !isBlockedPeer && messagesCount === 0 && (
          <View>
            <Text style={styles.chatPlaceholderText}>
              This is the beginning of your{"\n"}conversation with{" "}
              {conversation ? conversationName(conversation) : ""}
            </Text>
            <Button
              variant="primary"
              picto="hand.wave"
              title="Say hi"
              style={styles.cta}
              onPress={() => {
                sendMessage("👋");
              }}
            />
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    chatPlaceholder: {
      flex: 1,
      justifyContent: "center",
    },
    chatPlaceholderContent: {
      paddingVertical: 20,
      flex: 1,
    },
    chatPlaceholderText: {
      textAlign: "center",
      fontSize: 17,
      color: textPrimaryColor(colorScheme),
    },
    cta: {
      alignSelf: "center",
      paddingRight: 12,
      paddingLeft: 22,
      borderRadius: 100,
      paddingVertical: 7,
      marginTop: 20,
    },
  });
