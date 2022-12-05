import {
  Chat,
  defaultTheme,
  MessageType,
} from "../vendor/react-native-chat-ui";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useContext, useEffect } from "react";

import { NavigationParamList } from "./Navigation";
import { AppContext } from "../store/context";
import { sendXmtpMessage } from "../components/XmtpWebview";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { shortAddress } from "../utils/str";
import { useActionSheet } from "@expo/react-native-action-sheet";
import * as Clipboard from "expo-clipboard";
import { Theme } from "@flyerhq/react-native-chat-ui";
import { DispatchTypes } from "../store/reducers";
import uuid from "react-native-uuid";

const Conversation = ({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Conversation">) => {
  const { state, dispatch } = useContext(AppContext);
  const conversation = state.xmtp.conversations[route.params.topic];
  const { showActionSheetWithOptions } = useActionSheet();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          onPress={() => {
            showActionSheetWithOptions(
              {
                options: ["Copy wallet address", "Cancel"],
                cancelButtonIndex: 1,
                title: route.params.peerAddress,
              },
              (selectedIndex?: number) => {
                switch (selectedIndex) {
                  case 0:
                    Clipboard.setStringAsync(route.params.peerAddress);
                    break;

                  default:
                    break;
                }
              }
            );
          }}
        >
          <Text style={styles.title}>
            {shortAddress(route.params.peerAddress)}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [state.xmtp.address]);

  let messages = [] as MessageType.Any[];
  if (conversation?.messages) {
    messages = conversation.messages.map((m) => ({
      author: {
        id: m.senderAddress,
      },
      createdAt: m.sent,
      id: m.id,
      text: m.content,
      type: "text",
    }));
  }

  const handleSendPress = useCallback((m: MessageType.PartialText) => {
    // Lazy message
    dispatch({
      type: DispatchTypes.XmtpNewMessage,
      payload: {
        topic: conversation.topic,
        message: {
          id: uuid.v4().toString(),
          senderAddress: state.xmtp.address || "",
          sent: new Date().getTime(),
          content: m.text,
          lazy: true,
        },
      },
    });
    sendXmtpMessage(conversation.topic, m.text);
  }, []);

  return (
    <Chat
      messages={messages}
      onSendPress={handleSendPress}
      user={{
        id: state.xmtp.address || "",
      }}
      theme={chatTheme}
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
