import { useActionSheet } from "@expo/react-native-action-sheet";
import { Theme } from "@flyerhq/react-native-chat-ui";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { SFSymbol } from "react-native-sfsymbols";
import uuid from "react-native-uuid";

import Button from "../components/Button";
import InviteBanner from "../components/InviteBanner";
import {
  sendMessageToWebview,
  sendXmtpMessage,
} from "../components/XmtpWebview";
import { AppContext } from "../data/store/context";
import { XmtpConversation, XmtpDispatchTypes } from "../data/store/xmtpReducer";
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
import { getAddressForPeer } from "../utils/eth";
import { conversationName, getTitleFontScale } from "../utils/str";
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

  const [peerAddress, setPeerAddress] = useState(
    route.params.mainConversationWithPeer || ""
  );

  const initialConversation = route.params.topic
    ? state.xmtp.conversations[route.params.topic]
    : undefined;

  const [conversation, setConversation] = useState<
    XmtpConversation | undefined
  >(initialConversation);

  useEffect(() => {
    if (route.params.topic) {
      setConversation(state.xmtp.conversations[route.params.topic]);
    } else if (peerAddress) {
      setConversation(
        Object.values(state.xmtp.conversations).find(
          (c) =>
            c.peerAddress.toLowerCase() === peerAddress.toLowerCase() &&
            !c.context
        )
      );
    }
  }, [
    peerAddress,
    route.params.mainConversationWithPeer,
    route.params.topic,
    state.xmtp.conversations,
  ]);

  useEffect(() => {
    if (conversation) {
      setPeerAddress(conversation.peerAddress);
    }
  }, [conversation]);

  const sentNewConversationRequest = useRef(false);

  useEffect(() => {
    const openConversationWithPeer = async () => {
      if (
        !conversation &&
        route.params.mainConversationWithPeer &&
        !sentNewConversationRequest.current
      ) {
        sentNewConversationRequest.current = true;
        // Create new conversation
        const peerAddress = await getAddressForPeer(
          route.params.mainConversationWithPeer
        );
        if (!peerAddress) return;
        const alreadyConversationWithPeer = Object.values(
          state.xmtp.conversations
        ).find(
          (c) =>
            c.peerAddress.toLowerCase() === peerAddress.toLowerCase() &&
            !c.context
        );
        if (alreadyConversationWithPeer) {
          setConversation(alreadyConversationWithPeer);
        } else {
          setPeerAddress(peerAddress || "");
          sendMessageToWebview("CREATE_CONVERSATION", {
            peerAddress,
            context: null,
          });
        }
      }
    };
    openConversationWithPeer();
  }, [
    conversation,
    route.params.mainConversationWithPeer,
    state.xmtp.conversations,
  ]);

  const messageToPrefill =
    route.params.message || conversation?.currentMessage || "";
  const [messageValue, setMessageValue] = useState(messageToPrefill);
  const focusMessageInput = !!route.params.focus || !!messageToPrefill;
  const { showActionSheetWithOptions } = useActionSheet();
  const styles = getStyles(colorScheme);
  const [showInvite, setShowInvite] = useState({
    show: false,
    banner: false,
  });

  useEffect(() => {
    const checkIfUserExists = async () => {
      if (!peerAddress) return;
      const [exists, alreadyInvided] = await Promise.all([
        userExists(peerAddress),
        AsyncStorage.getItem(`converse-invited-${peerAddress}`),
      ]);
      if (!exists) {
        setShowInvite({
          show: true,
          banner: !alreadyInvided,
        });
      }
    };
    checkIfUserExists();
  }, [peerAddress]);

  const hideInviteBanner = useCallback(() => {
    setShowInvite({ show: true, banner: false });
    AsyncStorage.setItem(`converse-invited-${peerAddress}`, "true");
  }, [peerAddress]);

  const inviteToConverse = useCallback(() => {
    const inviteText =
      "I am using Converse, the fastest XMTP client, as my web3 messaging app. You can download the app here: https://testflight.apple.com/join/w4exeswh";
    messageContent.current = inviteText;
    setMessageValue(inviteText);
    textInputRef.current?.focus();
    setShowInvite({ show: true, banner: false });
    AsyncStorage.setItem(`converse-invited-${peerAddress}`, "true");
  }, [peerAddress]);

  const titleFontScale = getTitleFontScale();

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
                    title: peerAddress,
                  },
                  (selectedIndex?: number) => {
                    switch (selectedIndex) {
                      case 0:
                        Clipboard.setStringAsync(peerAddress || "");
                        break;

                      default:
                        break;
                    }
                  }
                );
              }}
            >
              <Text
                style={[styles.title, { fontSize: 17 * titleFontScale }]}
                numberOfLines={1}
                allowFontScaling={false}
              >
                {conversation ? conversationName(conversation) : ""}
              </Text>
            </TouchableOpacity>
          )}
          {(!state.xmtp.initialLoadDone ||
            state.xmtp.loading ||
            !conversation) && <ActivityIndicator />}
        </>
      ),
      headerRight: () => {
        return (
          <>
            {showInvite.show && !showInvite.banner && (
              <Button
                variant="text"
                title="Invite"
                onPress={inviteToConverse}
                allowFontScaling={false}
                textStyle={{ fontSize: 17 * titleFontScale }}
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
    peerAddress,
    showActionSheetWithOptions,
    showInvite,
    state.xmtp.initialLoadDone,
    state.xmtp.loading,
    styles.title,
    titleFontScale,
  ]);

  const [messages, setMessages] = useState([] as MessageType.Any[]);

  useEffect(() => {
    const newMessages = [] as MessageType.Any[];
    const messagesArray = Array.from(
      conversation ? conversation.messages.values() : []
    );
    const messagesLength = messagesArray.length;
    conversation?.lazyMessages.forEach((m) => {
      // Do not push lazy messages we already have
      if (!conversation?.messages.get(m.id)) {
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
    conversation,
    conversation?.lazyMessages,
    conversation?.messages,
    state.xmtp.lastUpdateAt,
  ]);

  const messageContent = useRef(messageToPrefill);

  const handleSendPress = useCallback(
    (m: MessageType.PartialText) => {
      if (!conversation) return;
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
      // Delaying sending to XMTP to be 100% sure
      // the lazy message has been saved first
      setTimeout(() => {
        sendXmtpMessage(conversation.topic, m.text);
      }, 10);
    },
    [conversation, dispatch, state.xmtp.address]
  );

  const textInputRef = useRef<TextInput>();

  const onLeaveScreen = useCallback(() => {
    if (!conversation) return;
    dispatch({
      type: XmtpDispatchTypes.XmtpSetCurrentMessageContent,
      payload: { topic: conversation.topic, content: messageContent.current },
    });
  }, [conversation, dispatch]);

  useEffect(() => {
    navigation.addListener("beforeRemove", onLeaveScreen);
    return () => {
      navigation.removeListener("beforeRemove", onLeaveScreen);
    };
  }, [navigation, onLeaveScreen]);

  return (
    <View style={styles.container}>
      {showInvite.show && showInvite.banner && (
        <InviteBanner
          onClickInvite={inviteToConverse}
          onClickHide={hideInviteBanner}
        />
      )}
      <Chat
        key={`chat-${colorScheme}`}
        messages={messages}
        onSendPress={handleSendPress}
        user={{
          id: state.xmtp.address || "",
        }}
        // Using default if we have a convo,
        // hide if we don't have one (creating)
        customBottomComponent={
          conversation
            ? undefined
            : () => {
                return null;
              }
        }
        emptyState={() =>
          conversation ? null : (
            <Text
              style={chatTheme(colorScheme).fonts.emptyChatPlaceholderTextStyle}
            >
              Opening your conversation...
            </Text>
          )
        }
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
    icons: {
      ...defaultTheme.icons,
      sendButtonIcon: () => (
        <SFSymbol
          name="paperplane"
          weight="regular"
          scale="large"
          color={textPrimaryColor(colorScheme)}
          size={18}
          resizeMode="center"
          multicolor={false}
          style={{ width: 24, height: 24 }}
        />
      ),
    },
  } as Theme);
