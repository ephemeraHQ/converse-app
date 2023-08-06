import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { isAddress } from "ethers/lib/utils";
import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  MutableRefObject,
  createRef,
} from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { createContext, useContextSelector } from "use-context-selector";

import Button from "../components/Button/Button";
import ConverseChat from "../components/Chat/Chat";
import ConversationTitle from "../components/Conversation/ConversationTitle";
import InviteBanner from "../components/InviteBanner";
import Picto from "../components/Picto/Picto";
import { getLocalXmtpConversationForTopic } from "../components/XmtpState";
import config from "../config";
import {
  cleanupPendingConversations,
  createPendingConversation,
} from "../data/helpers/conversations/pendingConversations";
import {
  markConversationRead,
  markConversationReadUntil,
} from "../data/helpers/conversations/upsertConversations";
import {
  useChatStore,
  useSettingsStore,
  useUserStore,
} from "../data/store/accountsStore";
import { XmtpConversationWithUpdate } from "../data/store/chatStore";
import { userExists } from "../utils/api";
import {
  backgroundColor,
  headerTitleStyle,
  itemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import { getAddressForPeer } from "../utils/eth";
import { eventEmitter } from "../utils/events";
import { lastValueInMap } from "../utils/map";
import { pick } from "../utils/objects";
import { sentryTrackMessage } from "../utils/sentry";
import { getTitleFontScale, TextInputWithValue } from "../utils/str";
import { isOnXmtp } from "../utils/xmtp";
import { NavigationParamList } from "./Main";

const Conversation = ({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Conversation">) => {
  const userAddress = useUserStore((s) => s.userAddress);
  const colorScheme = useColorScheme();
  const blockedPeers = useSettingsStore((s) => s.blockedPeers);
  const { conversations, conversationsMapping, setConversationMessageDraft } =
    useChatStore((s) =>
      pick(s, [
        "conversations",
        "conversationsMapping",
        "setConversationMessageDraft",
      ])
    );

  // Initial conversation topic will be set only if in route params
  const [_conversationTopic, setConversationTopic] = useState(
    route.params.topic
  );

  // When we set the conversation topic, we check if it has been mapped
  // to a new one (for pending conversations)
  const conversationTopic =
    _conversationTopic && conversationsMapping[_conversationTopic]
      ? conversationsMapping[_conversationTopic]
      : _conversationTopic;

  // Initial conversation will be set only if topic in route params
  const [conversation, setConversation] = useState(
    conversationTopic ? conversations[conversationTopic] : undefined
  );

  // Initial peer address will be set from the route params
  // for main convo or through the found convo if exists
  const [peerAddress, setPeerAddress] = useState(
    isAddress(route.params.mainConversationWithPeer || "")
      ? route.params.mainConversationWithPeer
      : conversation?.peerAddress
  );

  // When we set the conversation, we set the peer address
  // and preload the local convo for faster sending
  useEffect(() => {
    if (conversation && conversation.peerAddress !== peerAddress) {
      setPeerAddress(conversation.peerAddress);
    }
    if (conversation && !conversation.pending) {
      getLocalXmtpConversationForTopic(conversation.topic);
    }
  }, [conversation, peerAddress]);

  const openedMainConvo = useRef(false);

  const openMainConversationWithPeer = useCallback(
    async (peerToCreateConvoWith: string) => {
      if (openedMainConvo.current) return;
      openedMainConvo.current = true;
      // First, resolve the peer to an address
      const peerAddress = await getAddressForPeer(peerToCreateConvoWith);
      if (!peerAddress) {
        sentryTrackMessage("CREATE_CONVERSATION_ERROR", {
          error: "Identity not found",
        });
        Alert.alert(
          "Identity not found",
          `We could not find the address attached to ${peerToCreateConvoWith}`,
          [
            {
              text: "OK",
              onPress: navigation.goBack,
              isPreferred: true,
            },
          ]
        );
        return;
      }
      // Then, check if we already have a main conversation with this address
      const alreadyConversationWithAddress = Object.values(conversations).find(
        (c) =>
          c.peerAddress?.toLowerCase() === peerAddress.toLowerCase() &&
          !c.context
      );
      if (alreadyConversationWithAddress) {
        setConversationTopic(alreadyConversationWithAddress.topic);
      } else {
        // We don't have a convo with this peer, let's check if we
        // can create a new one
        const onNetwork = await isOnXmtp(peerAddress);
        if (!onNetwork) {
          Alert.alert(
            "Not yet using XMTP",
            "Your contact is not yet using XMTP. Tell them to download the app at converse.xyz and log in with their wallet.",
            [
              {
                text: "OK",
                onPress: navigation.goBack,
                isPreferred: true,
              },
            ]
          );
        } else {
          // Creating the conversation locally in a lazy manner
          const topic = await createPendingConversation(peerAddress, undefined);
          setConversationTopic(topic);
        }
      }
    },
    [navigation.goBack, conversations]
  );

  // When the conversation topic changes, we set the conversation object
  useEffect(() => {
    if (conversationTopic) {
      const foundConversation = conversations[conversationTopic];
      if (foundConversation) {
        setConversation(foundConversation);
      }
    } else if (route.params.mainConversationWithPeer) {
      openMainConversationWithPeer(route.params.mainConversationWithPeer);
    }
  }, [
    conversationTopic,
    openMainConversationWithPeer,
    route.params.mainConversationWithPeer,
    conversations,
  ]);

  const isBlockedPeer = conversation?.peerAddress
    ? !!blockedPeers[conversation.peerAddress.toLowerCase()]
    : false;

  const textInputRef = useRef<TextInputWithValue>();

  const messageToPrefill =
    route.params.message || conversation?.messageDraft || "";

  const focusOnLayout = useRef(false);
  const chatLayoutDone = useRef(false);
  const alreadyAutomaticallyFocused = useRef(false);

  const onReadyToFocus = useCallback(() => {
    if (alreadyAutomaticallyFocused.current) return;
    if (focusOnLayout.current && !chatLayoutDone.current) {
      chatLayoutDone.current = true;
      alreadyAutomaticallyFocused.current = true;
      textInputRef.current?.focus();
    } else {
      chatLayoutDone.current = true;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("transitionEnd", (e) => {
      if (!e.data.closing && !!route.params.focus) {
        if (chatLayoutDone.current && !alreadyAutomaticallyFocused.current) {
          alreadyAutomaticallyFocused.current = true;
          textInputRef.current?.focus();
        } else {
          focusOnLayout.current = true;
        }
      }
    });

    return unsubscribe;
  }, [navigation, route.params.focus]);

  const styles = useStyles();
  const [showInvite, setShowInvite] = useState({
    show: false,
    banner: false,
  });

  const alreadyCheckedIfUserExists = useRef(false);

  const checkIfUserExists = useCallback(async () => {
    if (!peerAddress || alreadyCheckedIfUserExists.current || !conversation)
      return;
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
  }, [conversation, peerAddress]);

  const hideInviteBanner = useCallback(() => {
    setShowInvite({ show: true, banner: false });
    AsyncStorage.setItem(`converse-invited-${peerAddress}`, "true");
  }, [peerAddress]);

  const inviteToConverse = useCallback(() => {
    const inviteText = `I am using Converse, the fastest XMTP client, as my web3 messaging app. You can download the app here: https://${config.websiteDomain}/`;
    eventEmitter.emit("setCurrentConversationInputValue", inviteText);
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
          navigation={navigation}
          route={route}
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
    inviteToConverse,
    isBlockedPeer,
    navigation,
    peerAddress,
    route,
    showInvite.banner,
    showInvite.show,
    styles.title,
    titleFontScale,
  ]);

  useEffect(() => {
    if (conversation) {
      const lastMessageTimestamp = lastValueInMap(conversation.messages)?.sent;
      if (lastMessageTimestamp) {
        markConversationReadUntil(conversation, lastMessageTimestamp);
      }
    }
  }, [conversation]);

  const onLeaveScreen = useCallback(async () => {
    if (!conversation || !textInputRef.current) return;
    await markConversationRead(conversation);
    await cleanupPendingConversations();
    setConversationMessageDraft(
      conversation.topic,
      textInputRef.current.currentValue
    );
  }, [conversation, setConversationMessageDraft]);

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
      <ConversationContext.Provider
        value={{
          conversation,
          messageToPrefill,
          inputRef: textInputRef,
          isBlockedPeer,
          onReadyToFocus,
        }}
      >
        <ConverseChat />
      </ConversationContext.Provider>
    </View>
  );
};

export default Conversation;

type ConversationContextType = {
  conversation?: XmtpConversationWithUpdate;
  inputRef: MutableRefObject<TextInputWithValue | undefined>;
  isBlockedPeer: boolean;
  onReadyToFocus: () => void;
  messageToPrefill: string;
};

export const ConversationContext = createContext<ConversationContextType>({
  conversation: undefined,
  inputRef: createRef() as MutableRefObject<TextInputWithValue | undefined>,
  isBlockedPeer: false,
  onReadyToFocus: () => {},
  messageToPrefill: "",
});

export const useConversationContext = <K extends keyof ConversationContextType>(
  keys: K[]
) => useContextSelector(ConversationContext, (s) => pick(s, keys));

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
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
};
