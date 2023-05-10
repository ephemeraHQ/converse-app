import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
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
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import uuid from "react-native-uuid";

import Button from "../components/Button/Button";
import ConverseChat from "../components/Chat/Chat";
import ConversationTitle from "../components/Conversation/ConversationTitle";
import InviteBanner from "../components/InviteBanner";
import Picto from "../components/Picto/Picto";
import {
  getLocalXmtpConversationForTopic,
  sendPendingMessages,
} from "../components/XmtpState";
import { sendMessageToWebview } from "../components/XmtpWebview";
import {
  markConversationRead,
  markConversationReadUntil,
  saveMessages,
} from "../data";
import { AppContext } from "../data/store/context";
import {
  XmtpConversationWithUpdate,
  XmtpDispatchTypes,
} from "../data/store/xmtpReducer";
import { userExists } from "../utils/api";
import {
  backgroundColor,
  headerTitleStyle,
  itemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import { getAddressForPeer } from "../utils/eth";
import { lastValueInMap } from "../utils/map";
import { getTitleFontScale } from "../utils/str";
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
    XmtpConversationWithUpdate | undefined
  >(initialConversation);

  useEffect(() => {
    if (route.params.topic) {
      const foundConversation = state.xmtp.conversations[route.params.topic];
      if (foundConversation) {
        setConversation(foundConversation);
      }
    } else if (peerAddress) {
      const foundConversation = Object.values(state.xmtp.conversations).find(
        (c) =>
          c.peerAddress?.toLowerCase() === peerAddress.toLowerCase() &&
          !c.context
      );
      if (foundConversation) {
        setConversation(foundConversation);
      }
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
  }, [conversation, dispatch]);

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
  const [inputValue, setInputValue] = useState(messageToPrefill);

  useEffect(() => {
    const unsubscribe = navigation.addListener("transitionEnd", (e) => {
      if (!e.data.closing && (!!route.params.focus || !!messageToPrefill)) {
        textInputRef.current?.focus();
      }
    });

    return unsubscribe;
  }, [messageToPrefill, navigation, route.params.focus]);

  const styles = getStyles(colorScheme);
  const [showInvite, setShowInvite] = useState({
    show: false,
    banner: false,
  });

  const alreadyCheckedIfUserExists = useRef(false);

  const checkIfUserExists = useCallback(async () => {
    if (!peerAddress || alreadyCheckedIfUserExists.current) return;
    alreadyCheckedIfUserExists.current = true;
    const [exists, alreadyInvided] = await Promise.all([
      userExists(peerAddress),
      AsyncStorage.getItem(`converse-invited-${peerAddress}`),
    ]);
    if (!exists) {
      setTimeout(() => {
        setShowInvite({
          show: true,
          banner: !alreadyInvided,
        });
      }, 200);
    }
  }, [peerAddress]);

  const hideInviteBanner = useCallback(() => {
    setShowInvite({ show: true, banner: false });
    AsyncStorage.setItem(`converse-invited-${peerAddress}`, "true");
  }, [peerAddress]);

  const inviteToConverse = useCallback(() => {
    const inviteText =
      "I am using Converse, the fastest XMTP client, as my web3 messaging app. You can download the app here: https://getconverse.app/";
    setInputValue(inviteText);
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
          textInputRef={textInputRef}
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
    showInvite.banner,
    showInvite.show,
    state,
    styles.title,
    titleFontScale,
  ]);

  useEffect(() => {
    if (conversation) {
      const lastMessageTimestamp = lastValueInMap(conversation.messages)?.sent;
      if (lastMessageTimestamp) {
        markConversationReadUntil(conversation, lastMessageTimestamp, dispatch);
      }
    }
  }, [conversation, dispatch]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversation) return;
      setInputValue("");
      const messageId = uuid.v4().toString();
      const sentAtTime = new Date();

      // Save to DB immediatly
      await saveMessages(
        [
          {
            id: messageId,
            senderAddress: state.xmtp.address || "",
            sent: sentAtTime.getTime(),
            content,
            status: "sending",
          },
        ],
        conversation.topic,
        dispatch
      );
      // Then send for real
      sendPendingMessages(dispatch);
    },
    [conversation, dispatch, state.xmtp.address]
  );

  const onLeaveScreen = useCallback(() => {
    if (!conversation) return;
    dispatch({
      type: XmtpDispatchTypes.XmtpSetCurrentMessageContent,
      payload: { topic: conversation.topic, content: inputValue },
    });
    markConversationRead(conversation, dispatch);
  }, [conversation, dispatch, inputValue]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("beforeRemove", onLeaveScreen);
    return unsubscribe;
  }, [navigation, onLeaveScreen]);

  const showInviteBanner =
    showInvite.show && showInvite.banner && !isBlockedPeer;

  return (
    <View style={styles.container} onLayout={checkIfUserExists}>
      {showInviteBanner && (
        <InviteBanner
          onClickInvite={inviteToConverse}
          onClickHide={hideInviteBanner}
        />
      )}
      <ConverseChat
        conversation={conversation}
        xmtpAddress={state.xmtp.address}
        setInputValue={setInputValue}
        inputValue={inputValue}
        inputRef={textInputRef}
        sendMessage={sendMessage}
      />
      {/* <Chat
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
      /> */}
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
