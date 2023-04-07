import { useActionSheet } from "@expo/react-native-action-sheet";
import { Theme } from "@flyerhq/react-native-chat-ui";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { fromNanoString } from "@xmtp/xmtp-js";
import { PreparedMessage } from "@xmtp/xmtp-js/dist/types/src/PreparedMessage";
import { isAddress } from "ethers/lib/utils";
import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import {
  ColorSchemeName,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import uuid from "react-native-uuid";

import Button from "../components/Button/Button";
import ConversationTitle from "../components/Conversation/ConversationTitle";
import InviteBanner from "../components/InviteBanner";
import Picto from "../components/Picto/Picto";
import {
  getLocalXmtpConversationForTopic,
  prepareXmtpMessage,
  sendPreparedMessage,
} from "../components/XmtpState";
import { sendMessageToWebview } from "../components/XmtpWebview";
import { saveMessages } from "../data";
import { AppContext } from "../data/store/context";
import { XmtpConversation, XmtpDispatchTypes } from "../data/store/xmtpReducer";
import { userExists } from "../utils/api";
import {
  backgroundColor,
  headerTitleStyle,
  itemSeparatorColor,
  messageBubbleColor,
  myMessageBubbleColor,
  chatInputBackgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import { getAddressForPeer } from "../utils/eth";
import { getTitleFontScale } from "../utils/str";
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

  const initialConversation = route.params.topic
    ? state.xmtp.conversations[route.params.topic]
    : undefined;

  const [peerAddress, setPeerAddress] = useState(
    isAddress(route.params.mainConversationWithPeer || "")
      ? route.params.mainConversationWithPeer
      : initialConversation
      ? initialConversation.peerAddress
      : ""
  );

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
            c.peerAddress?.toLowerCase() === peerAddress.toLowerCase() &&
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
      getLocalXmtpConversationForTopic(conversation.topic);
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
            c.peerAddress?.toLowerCase() === peerAddress.toLowerCase() &&
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

  const isBlockedPeer = conversation?.peerAddress
    ? !!state.xmtp.blockedPeerAddresses[conversation.peerAddress.toLowerCase()]
    : false;

  const textInputRef = useRef<TextInput>();

  const messageToPrefill =
    route.params.message || conversation?.currentMessage || "";
  const [messageValue, setMessageValue] = useState(messageToPrefill);
  useEffect(() => {
    if (!!route.params.focus || !!messageToPrefill) {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 150);
    }
  }, [messageToPrefill, route.params.focus]);
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
      "I am using Converse, the fastest XMTP client, as my web3 messaging app. You can download the app here: https://getconverse.app/";
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
        <ConversationTitle
          conversation={conversation}
          peerAddress={peerAddress}
          isBlockedPeer={isBlockedPeer}
        />
      ),
      headerRight: () => {
        return (
          <>
            {showInvite.show &&
              !showInvite.banner &&
              (Platform.OS === "android" ? (
                <TouchableOpacity onPress={inviteToConverse}>
                  <Picto
                    picto="addlink"
                    size={24}
                    color={textSecondaryColor(colorScheme)}
                  />
                </TouchableOpacity>
              ) : (
                <Button
                  variant="text"
                  title="Invite"
                  onPress={inviteToConverse}
                  allowFontScaling={false}
                  textStyle={{ fontSize: 17 * titleFontScale }}
                />
              ))}
          </>
        );
      },
      headerTintColor:
        Platform.OS === "android" ? textSecondaryColor(colorScheme) : undefined,
    });
  }, [
    colorScheme,
    conversation,
    dispatch,
    inviteToConverse,
    isBlockedPeer,
    navigation,
    peerAddress,
    showActionSheetWithOptions,
    showInvite.banner,
    showInvite.show,
    state,
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
        status: m.status || "sent",
      });
    }
    setMessages(newMessages);
  }, [conversation, conversation?.messages, state.xmtp.lastUpdateAt]);

  const messageContent = useRef(messageToPrefill);

  const handleSendPress = useCallback(
    async (m: MessageType.PartialText) => {
      if (!conversation) return;
      messageContent.current = "";
      setMessageValue("");
      let messageId = uuid.v4().toString();
      let sentAtTime = new Date();
      let preparedMessage: PreparedMessage | null = null;
      if (state.xmtp.localConnected) {
        try {
          preparedMessage = await prepareXmtpMessage(
            conversation.topic,
            m.text
          );
          messageId = await preparedMessage.messageID();
          sentAtTime =
            (preparedMessage.messageEnvelope as any)?.timestamp ||
            fromNanoString(preparedMessage.messageEnvelope.timestampNs);
          if (!sentAtTime) return;
        } catch (e) {}
      }

      // Save to DB immediatly
      saveMessages(
        [
          {
            id: messageId,
            senderAddress: state.xmtp.address || "",
            sent: sentAtTime.getTime(),
            content: m.text,
            status: "sending",
          },
        ],
        conversation.topic,
        dispatch
      );
      // Then send for real
      if (preparedMessage) {
        sendPreparedMessage(messageId, preparedMessage);
      }
    },
    [conversation, dispatch, state.xmtp.address]
  );

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
      {showInvite.show && showInvite.banner && !isBlockedPeer && (
        <InviteBanner
          onClickInvite={inviteToConverse}
          onClickHide={hideInviteBanner}
        />
      )}
      <Chat
        key={`chat-${colorScheme}`}
        messages={isBlockedPeer ? [] : messages}
        onSendPress={handleSendPress}
        user={{
          id: state.xmtp.address || "",
        }}
        // Using default if we have a convo,
        // hide if we don't have one (creating)
        customBottomComponent={
          conversation && !isBlockedPeer
            ? undefined
            : () => {
                return null;
              }
        }
        emptyState={() =>
          conversation && !isBlockedPeer ? null : (
            <Text
              style={chatTheme(colorScheme).fonts.emptyChatPlaceholderTextStyle}
            >
              {isBlockedPeer
                ? "This user is blocked"
                : "Opening your conversation..."}
            </Text>
          )
        }
        theme={chatTheme(colorScheme)}
        usePreviewData={false}
        textInputProps={{
          defaultValue: messageToPrefill,
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
    title: headerTitleStyle(colorScheme),
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
      inputBackground: chatInputBackgroundColor(colorScheme),
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
        <Picto
          picto="paperplane"
          color={textPrimaryColor(colorScheme)}
          style={{ width: 24, height: 24 }}
          size={Platform.OS === "android" ? 24 : 18}
        />
      ),
    },
  } as Theme);
