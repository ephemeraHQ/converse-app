import { MutableRefObject, useContext } from "react";
import {
  ColorSchemeName,
  useColorScheme,
  StyleSheet,
  TextInput,
  Platform,
  Text,
  TouchableWithoutFeedback,
  ScrollView,
  View,
} from "react-native";

import { AppContext } from "../../data/store/context";
import {
  XmtpConversationWithUpdate,
  XmtpDispatchTypes,
} from "../../data/store/xmtpReducer";
import { blockPeer } from "../../utils/api";
import { textPrimaryColor } from "../../utils/colors";
import { conversationName } from "../../utils/str";
import ActivityIndicator from "../ActivityIndicator/ActivityIndicator";
import Button from "../Button/Button";

type Props = {
  conversation?: XmtpConversationWithUpdate;
  inputAboveKeyboardRef: MutableRefObject<TextInput | undefined>;
  sendMessage: (content: string) => Promise<void>;
  isBlockedPeer: boolean;
  messagesCount: number;
};

export default function ChatPlaceholder({
  inputAboveKeyboardRef,
  isBlockedPeer,
  conversation,
  messagesCount,
  sendMessage,
}: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const { dispatch } = useContext(AppContext);
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (Platform.OS === "ios") {
          inputAboveKeyboardRef.current?.blur();
        }
      }}
    >
      <ScrollView
        automaticallyAdjustKeyboardInsets
        style={styles.chatPlaceholder}
        contentContainerStyle={styles.chatPlaceholderContent}
        keyboardDismissMode="interactive"
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 100,
        }}
        alwaysBounceVertical={false}
      >
        <View style={{ marginTop: "auto" }} />
        {!conversation && (
          <>
            <ActivityIndicator style={{ marginBottom: 20 }} />
            <Text style={styles.chatPlaceholderText}>
              Opening your conversation
            </Text>
          </>
        )}
        {conversation && isBlockedPeer && (
          <>
            <Text style={styles.chatPlaceholderText}>This user is blocked</Text>
            <Button
              variant="primary"
              picto="lock.open"
              title="Unblock"
              style={styles.cta}
              onPress={() => {
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
              }}
            />
          </>
        )}
        {conversation && !isBlockedPeer && messagesCount === 0 && (
          <>
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
          </>
        )}
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    chatPlaceholder: {
      flex: 1,
    },
    chatPlaceholderContent: {
      flex: 0.52,
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
      marginBottom: 20,
    },
  });
