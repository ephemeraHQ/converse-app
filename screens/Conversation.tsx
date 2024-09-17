import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  backgroundColor,
  headerTitleStyle,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { isAddress } from "ethers/lib/utils";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";
import { gestureHandlerRootHOC } from "react-native-gesture-handler";

import { NavigationParamList } from "./Navigation/Navigation";
import ConverseChat from "../components/Chat/Chat";
import ConversationTitle from "../components/Conversation/ConversationTitle";
import {
  currentAccount,
  useChatStore,
  useSettingsStore,
} from "../data/store/accountsStore";
import { MediaPreview } from "../data/store/chatStore";
import { useSelect } from "../data/store/storeHelpers";
import {
  ConversationContext,
  openMainConversationWithPeer,
} from "../utils/conversation";
import { isDesktop } from "../utils/device";
import { converseEventEmitter } from "../utils/events";
import { setTopicToNavigateTo, topicToNavigateTo } from "../utils/navigation";
import { TextInputWithValue } from "../utils/str";
import { loadOlderMessages } from "../utils/xmtpRN/messages";

const Conversation = ({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Conversation">) => {
  const colorScheme = useColorScheme();
  const peersStatus = useSettingsStore((s) => s.peersStatus);
  const [transactionMode, setTransactionMode] = useState(false);
  const [frameTextInputFocused, setFrameTextInputFocused] = useState(false);

  const {
    conversations,
    conversationsMapping,
    setConversationMessageDraft,
    setConversationMediaPreview,
  } = useChatStore(
    useSelect([
      "conversations",
      "conversationsMapping",
      "setConversationMessageDraft",
      "setConversationMediaPreview",
      "lastUpdateAt", // Added even if unused to trigger a rerender
    ])
  );

  // Initial conversation topic will be set only if in route params
  const [_conversationTopic, setConversationTopic] = useState(
    route.params?.topic
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
    isAddress(route.params?.mainConversationWithPeer || "")
      ? route.params?.mainConversationWithPeer
      : conversation?.peerAddress
  );

  // When we set the conversation, we set the peer address
  // and preload the local convo for faster sending
  useEffect(() => {
    if (conversation && conversation.peerAddress !== peerAddress) {
      setPeerAddress(conversation.peerAddress);
    }
  }, [conversation, peerAddress]);

  const openedMainConvo = useRef(false);
  const isActive = conversation?.isGroup ? conversation.isActive : true;

  // When the conversation topic changes, we set the conversation object
  const conversationTopicRef = useRef(conversationTopic);
  const currentLastUpdateAt = conversation?.lastUpdateAt;
  useEffect(() => {
    if (
      conversationTopic &&
      (conversationTopicRef.current !== conversationTopic ||
        conversations[conversationTopic]?.lastUpdateAt !== currentLastUpdateAt)
    ) {
      const foundConversation = conversations[conversationTopic];
      if (foundConversation) {
        setConversation(foundConversation);
      }
    } else if (
      route.params?.mainConversationWithPeer &&
      !openedMainConvo.current
    ) {
      openedMainConvo.current = true;
      openMainConversationWithPeer(
        currentAccount(),
        route.params?.mainConversationWithPeer,
        setConversationTopic,
        navigation.goBack
      );
    }
    conversationTopicRef.current = conversationTopic;
  }, [
    currentLastUpdateAt,
    conversationTopic,
    conversations,
    navigation.goBack,
    route.params?.mainConversationWithPeer,
  ]);

  useEffect(() => {
    if (!isActive) {
      return navigation.navigate("Chats");
    }
  }, [isActive, navigation]);

  const isBlockedPeer = useMemo(
    () =>
      conversation?.peerAddress
        ? peersStatus[conversation.peerAddress.toLowerCase()] === "blocked"
        : false,
    [conversation?.peerAddress, peersStatus]
  );

  const textInputRef = useRef<TextInputWithValue>();
  const mediaPreviewRef = useRef<MediaPreview>();

  const messageToPrefill = useMemo(
    () => route.params?.message || conversation?.messageDraft || "",
    [conversation?.messageDraft, route.params?.message]
  );
  const mediaPreviewToPrefill = useMemo(
    () => conversation?.mediaPreview || null,
    [conversation?.mediaPreview]
  );
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

  const autofocus = route.params?.focus || isDesktop || Platform.OS === "web";

  useEffect(() => {
    const handleAutoFocus = () => {
      if (autofocus) {
        if (chatLayoutDone.current && !alreadyAutomaticallyFocused.current) {
          alreadyAutomaticallyFocused.current = true;
          textInputRef.current?.focus();
        } else {
          focusOnLayout.current = true;
        }
      }
    };

    const unsubscribe = navigation.addListener("transitionEnd", (e) => {
      if (!e.data.closing) {
        handleAutoFocus();
      }
    });

    if (Platform.OS === "web" || isDesktop) {
      handleAutoFocus();
    }

    return unsubscribe;
  }, [navigation, autofocus]);

  const styles = useStyles();

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <ConversationTitle
          conversation={conversation}
          textInputRef={textInputRef}
          navigation={navigation}
          route={route}
        />
      ),
      headerTintColor:
        Platform.OS === "android"
          ? textSecondaryColor(colorScheme)
          : textPrimaryColor(colorScheme),
    });
  }, [
    colorScheme,
    conversation,
    isBlockedPeer,
    navigation,
    peerAddress,
    route,
  ]);

  useEffect(() => {
    if (conversation) {
      // On load, we mark the conversation as read and as opened
      useChatStore.getState().setOpenedConversationTopic(conversation.topic);

      // On Web this loads them from network, on mobile from local db
      loadOlderMessages(currentAccount(), conversation.topic);

      // If we are navigating to a conversation, we reset the topic to navigate to
      if (topicToNavigateTo === conversation.topic) {
        setTopicToNavigateTo("");
      }
    }
  }, [conversation]);

  const onLeaveScreen = useCallback(async () => {
    if (!conversation) return;

    useChatStore.getState().setOpenedConversationTopic(null);
    if (textInputRef.current) {
      setConversationMessageDraft(
        conversation.topic,
        textInputRef.current.currentValue
      );
    }
    setConversationMediaPreview(
      conversation.topic,
      mediaPreviewRef.current || null
    );
  }, [conversation, setConversationMessageDraft, setConversationMediaPreview]);

  const onOpeningConversation = useCallback(
    ({ topic }: { topic: string }) => {
      if (topic !== conversationTopic) {
        onLeaveScreen();
      }
    },
    [conversationTopic, onLeaveScreen]
  );

  useEffect(() => {
    const unsubscribeBeforeRemove = navigation.addListener(
      "beforeRemove",
      onLeaveScreen
    );
    if (isDesktop) {
      converseEventEmitter.on("openingConversation", onOpeningConversation);
    }

    return () => {
      if (isDesktop) {
        converseEventEmitter.off("openingConversation", onOpeningConversation);
      }
      unsubscribeBeforeRemove();
    };
  }, [navigation, onLeaveScreen, onOpeningConversation]);

  return (
    <View style={styles.container} key={`conversation-${colorScheme}`}>
      {route.params?.topic || route.params?.mainConversationWithPeer ? (
        <ConversationContext.Provider
          value={{
            conversation,
            messageToPrefill,
            inputRef: textInputRef,
            mediaPreviewToPrefill,
            mediaPreviewRef,
            isBlockedPeer,
            onReadyToFocus,
            transactionMode,
            setTransactionMode,
            frameTextInputFocused,
            setFrameTextInputFocused,
          }}
        >
          <ConverseChat />
        </ConversationContext.Provider>
      ) : (
        <View style={styles.filler} />
      )}
    </View>
  );
};

export default gestureHandlerRootHOC(Conversation);

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    title: headerTitleStyle(colorScheme),
    filler: { flex: 1, backgroundColor: backgroundColor(colorScheme) },
  });
};
