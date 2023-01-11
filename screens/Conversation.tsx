import { useActionSheet } from "@expo/react-native-action-sheet";
import { Theme } from "@flyerhq/react-native-chat-ui";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import {
  ActivityIndicator,
  ColorSchemeName,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import uuid from "react-native-uuid";

import Button from "../components/Button";
import { sendXmtpMessage } from "../components/XmtpWebview";
import { AppContext } from "../data/store/context";
import { XmtpDispatchTypes } from "../data/store/xmtpReducer";
import { userExists } from "../utils/api";
import {
  backgroundColor,
  itemSeparatorColor,
  messageBubbleColor,
  myMessageBubbleColor,
  navigationSecondaryBackgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
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
  const colorScheme = useColorScheme();
  const conversation = state.xmtp.conversations[route.params.topic];
  const messageToPrefill =
    route.params.message || conversation.currentMessage || "";
  const [messageValue, setMessageValue] = useState(messageToPrefill);
  const focusMessageInput = route.params.focus || !!messageToPrefill;
  const { showActionSheetWithOptions } = useActionSheet();
  const styles = getStyles(colorScheme);
  const [showInviteBanner, setShowInviteBanner] = useState(false);

  useEffect(() => {
    const checkIfUserExists = async () => {
      const exists = await userExists(conversation.peerAddress);
      if (!exists) {
        setShowInviteBanner(true);
      }
    };
    checkIfUserExists();
  }, [conversation.peerAddress]);

  const inviteToConverse = useCallback(() => {
    const inviteText = "Salut, je t'invite";
    messageContent.current = inviteText;
    setMessageValue(inviteText);
    textInputRef.current?.focus();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <>
          {state.xmtp.initialLoadDone && !state.xmtp.loading && (
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
              <Text style={styles.title} numberOfLines={1}>
                {conversationName(conversation)}
              </Text>
            </TouchableOpacity>
          )}
          {(!state.xmtp.initialLoadDone || state.xmtp.loading) && (
            <ActivityIndicator />
          )}
        </>
      ),
      headerRight: () => {
        return (
          <>
            {showInviteBanner && (
              <Button
                variant="text"
                title="Invite"
                onPress={inviteToConverse}
              />
            )}
          </>
        );
      },
    });
  }, [
    conversation,
    inviteToConverse,
    navigation,
    showActionSheetWithOptions,
    showInviteBanner,
    state.xmtp.initialLoadDone,
    state.xmtp.loading,
    styles.title,
  ]);

  const [messages, setMessages] = useState([] as MessageType.Any[]);

  useEffect(() => {
    const newMessages = [] as MessageType.Any[];
    const messagesArray = Array.from(conversation.messages.values());
    const messagesLength = messagesArray.length;
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
    for (let index = messagesLength - 1; index >= 0; index--) {
      const m = messagesArray[index];
      newMessages.push({
        author: {
          id: m.senderAddress,
        },
        createdAt: m.sent,
        id: m.id,
        text: m.content,
        type: "text",
      });
    }
    setMessages(newMessages);
  }, [
    conversation.lazyMessages,
    conversation.messages,
    state.xmtp.lastUpdateAt,
  ]);

  const messageContent = useRef(messageToPrefill);

  const handleSendPress = useCallback(
    (m: MessageType.PartialText) => {
      messageContent.current = "";
      setMessageValue("");
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
  const textInputRef = useRef<TextInput>();

  const onLeaveScreen = useCallback(() => {
    dispatch({
      type: XmtpDispatchTypes.XmtpSetCurrentMessageContent,
      payload: { topic: conversation.topic, content: messageContent.current },
    });
  }, [conversation.topic, dispatch]);

  useEffect(() => {
    navigation.addListener("beforeRemove", onLeaveScreen);
    return () => {
      navigation.removeListener("beforeRemove", onLeaveScreen);
    };
  }, [navigation, onLeaveScreen]);

  return (
    <View style={styles.container}>
      <Chat
        messages={messages}
        onSendPress={handleSendPress}
        user={{
          id: state.xmtp.address || "",
        }}
        theme={chatTheme(colorScheme)}
        usePreviewData={false}
        textInputProps={{
          defaultValue: messageToPrefill,
          autoFocus: focusMessageInput,
          value: messageValue,
          onChangeText: (text) => {
            messageContent.current = text;
            setMessageValue(text);
          },
          placeholderTextColor: textSecondaryColor(colorScheme),
          // @ts-ignore
          ref: textInputRef,
        }}
      />
    </View>
  );
};

export default Conversation;

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    inviteBanner: {
      height: 63,
      borderBottomWidth: 1,
      borderBottomColor: itemSeparatorColor(colorScheme),
      backgroundColor: backgroundColor(colorScheme),
      paddingHorizontal: 30,
      alignItems: "center",
      flexDirection: "row",
    },
    inviteBannerLeft: {
      flexShrink: 1,
      marginRight: 10,
    },
    inviteTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: textPrimaryColor(colorScheme),
    },
    inviteSubtitle: {
      fontSize: 15,
      color: textSecondaryColor(colorScheme),
      fontWeight: "400",
    },
    inviteButton: {
      marginLeft: "auto",
    },
    title: {
      color: textPrimaryColor(colorScheme),
      fontSize: 17,
      fontWeight: "600",
      maxWidth: 150,
    },
  });

const chatTheme = (colorScheme: ColorSchemeName) =>
  ({
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
      background: backgroundColor(colorScheme),
      primary: myMessageBubbleColor(colorScheme),
      secondary: messageBubbleColor(colorScheme),
      inputBackground: navigationSecondaryBackgroundColor(colorScheme),
      inputText: textPrimaryColor(colorScheme),
    },
    fonts: {
      ...defaultTheme.fonts,
      inputTextStyle: {
        ...defaultTheme.fonts.inputTextStyle,
        fontWeight: "400",
        backgroundColor: backgroundColor(colorScheme),
        borderRadius: 15,
        minHeight: 33,
        paddingLeft: 12,
        marginTop: -10,
        marginBottom: -10,
      },
      receivedMessageBodyTextStyle: {
        ...defaultTheme.fonts.receivedMessageBodyTextStyle,
        fontWeight: "400",
        color: textPrimaryColor(colorScheme),
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
  } as Theme);
