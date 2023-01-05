import { useActionSheet } from "@expo/react-native-action-sheet";
import { Theme } from "@flyerhq/react-native-chat-ui";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import uuid from "react-native-uuid";

import { sendXmtpMessage } from "../components/XmtpWebview";
import { AppContext } from "../data/store/context";
import { XmtpDispatchTypes } from "../data/store/xmtpReducer";
import { conversationName } from "../utils/str";
import {
  Chat,
  defaultTheme,
  MessageType,
} from "../vendor/react-native-chat-ui";
import { NavigationParamList } from "./Main";

const Conversation = ({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Conversation">) => {
  const { state, dispatch } = useContext(AppContext);
  const conversation = state.xmtp.conversations[route.params.topic];
  const messageToPrefill = route.params.message;
  const { showActionSheetWithOptions } = useActionSheet();

  useEffect(() => {
    if (state.xmtp.initialLoadDone && !state.xmtp.loading) {
      navigation.setOptions({
        headerTitle: conversationName(conversation),
      });
    } else {
      navigation.setOptions({
        headerTitle: () => <ActivityIndicator />,
      });
    }
  }, [
    conversation,
    conversation.peerAddress,
    navigation,
    state.xmtp.initialLoadDone,
    state.xmtp.loading,
  ]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          onPress={() => {
            showActionSheetWithOptions(
              {
                options: ["Copy wallet address", "Cancel"],
                cancelButtonIndex: 1,
                title: conversation.peerAddress,
              },
              (selectedIndex?: number) => {
                switch (selectedIndex) {
                  case 0:
                    Clipboard.setStringAsync(conversation.peerAddress);
                    break;

                  default:
                    break;
                }
              }
            );
          }}
        >
          <Text style={styles.title}>{conversationName(conversation)}</Text>
        </TouchableOpacity>
      ),
    });
  }, [
    conversation,
    navigation,
    showActionSheetWithOptions,
    state.xmtp.address,
  ]);

  const [messages, setMessages] = useState([] as MessageType.Any[]);

  useEffect(() => {
    const newMessages = [] as MessageType.Any[];
    conversation.lazyMessages.forEach((m) => {
      newMessages.push({
        author: {
          id: m.senderAddress,
        },
        createdAt: m.sent,
        id: m.id,
        text: m.content,
        type: "text",
      });
    });
    conversation.messages.forEach((m) => {
      newMessages.push({
        author: {
          id: m.senderAddress,
        },
        createdAt: m.sent,
        id: m.id,
        text: m.content,
        type: "text",
      });
    });
    setMessages(newMessages);
  }, [
    conversation.lazyMessages,
    conversation.messages,
    state.xmtp.lastUpdateAt,
  ]);

  const handleSendPress = useCallback(
    (m: MessageType.PartialText) => {
      // Lazy message
      dispatch({
        type: XmtpDispatchTypes.XmtpLazyMessage,
        payload: {
          topic: conversation.topic,
          message: {
            id: uuid.v4().toString(),
            senderAddress: state.xmtp.address || "",
            sent: new Date().getTime(),
            content: m.text,
          },
        },
      });
      sendXmtpMessage(conversation.topic, m.text);
    },
    [conversation.topic, dispatch, state.xmtp.address]
  );

  return (
    <Chat
      messages={messages}
      onSendPress={handleSendPress}
      user={{
        id: state.xmtp.address || "",
      }}
      theme={chatTheme}
      textInputProps={{
        defaultValue: messageToPrefill,
        autoFocus: !!messageToPrefill || route.params.focus,
      }}
    />
  );
};

export default Conversation;

const styles = StyleSheet.create({
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
});

const chatTheme = {
  ...defaultTheme,
  borders: {
    ...defaultTheme.borders,
    messageBorderRadius: 12,
    inputBorderRadius: 0,
  },
  insets: {
    ...defaultTheme.insets,
    messageInsetsVertical: 6,
    messageInsetsHorizontal: 16,
  },
  colors: {
    ...defaultTheme.colors,
    primary: "#FC4F37",
    secondary: "#E9E9EB",
    inputBackground: "#F6F6F6",
    inputText: "#333333",
  },
  fonts: {
    ...defaultTheme.fonts,
    inputTextStyle: {
      ...defaultTheme.fonts.inputTextStyle,
      fontWeight: "400",
      backgroundColor: "white",
      borderRadius: 15,
      minHeight: 33,
      paddingLeft: 12,
      marginTop: -10,
      marginBottom: -10,
    },
    receivedMessageBodyTextStyle: {
      ...defaultTheme.fonts.receivedMessageBodyTextStyle,
      fontWeight: "400",
    },
    receivedMessageCaptionTextStyle: {
      ...defaultTheme.fonts.receivedMessageCaptionTextStyle,
      fontWeight: "400",
    },
    sentMessageBodyTextStyle: {
      ...defaultTheme.fonts.sentMessageBodyTextStyle,
      fontWeight: "400",
    },
    sentMessageCaptionTextStyle: {
      ...defaultTheme.fonts.sentMessageCaptionTextStyle,
      fontWeight: "400",
    },
  },
} as Theme;
