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
import { Chat } from "../components/Chat/Chat";
import ConversationTitle from "../components/Conversation/ConversationTitle";
import { EmojiPicker } from "../containers/EmojiPicker";
import {
  currentAccount,
  useChatStore,
  useSettingsStore,
} from "../data/store/accountsStore";
import { ChatStoreType, MediaPreview } from "../data/store/chatStore";
import { useSelect } from "../data/store/storeHelpers";
import {
  ConversationContext,
  openMainConversationWithPeer,
} from "../utils/conversation";
import { isDesktop } from "../utils/device";
import { converseEventEmitter } from "../utils/events";
import logger from "../utils/logger";
import { setTopicToNavigateTo, topicToNavigateTo } from "../utils/navigation";
import { TextInputWithValue } from "../utils/str";
import { loadOlderMessages } from "../utils/xmtpRN/messages";

const conversationSelectKeys: (keyof ChatStoreType)[] = [
  "conversations",
  "conversationsMapping",
  "setConversationMessageDraft",
  "setConversationMediaPreview",
  "lastUpdateAt",
];

const Conversation = ({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "Conversation">) => {
  logger.debug("[Conversation] Rendering Conversation screen", {
    routeParams: route.params,
  });

  const colorScheme = useColorScheme();
  const peersStatus = useSettingsStore((s) => s.peersStatus);
  const [transactionMode, setTransactionMode] = useState(false);
  const [frameTextInputFocused, setFrameTextInputFocused] = useState(false);
  const tagsFetchedOnceForMessage = useRef<{ [messageId: string]: boolean }>(
    {}
  );

  const {
    conversations,
    conversationsMapping,
    setConversationMessageDraft,
    setConversationMediaPreview,
  } = useChatStore(useSelect(conversationSelectKeys));

  const [_conversationTopic, setConversationTopic] = useState(
    route.params?.topic
  );

  const conversationTopic =
    _conversationTopic && conversationsMapping[_conversationTopic]
      ? conversationsMapping[_conversationTopic]
      : _conversationTopic;

  const [conversation, setConversation] = useState(
    conversationTopic ? conversations[conversationTopic] : undefined
  );

  const [peerAddress, setPeerAddress] = useState(
    isAddress(route.params?.mainConversationWithPeer || "")
      ? route.params?.mainConversationWithPeer
      : conversation?.peerAddress
  );

  useEffect(() => {
    if (conversation && conversation.peerAddress !== peerAddress) {
      logger.debug("[Conversation] Updating peer address", {
        oldAddress: peerAddress,
        newAddress: conversation.peerAddress,
      });
      setPeerAddress(conversation.peerAddress);
    }
  }, [conversation, peerAddress]);

  const openedMainConvo = useRef(false);
  const isActive = conversation?.isGroup ? conversation.isActive : true;

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
        logger.debug("[Conversation] Updating conversation", {
          topic: conversationTopic,
          lastUpdateAt: foundConversation.lastUpdateAt,
        });
        setConversation(foundConversation);
      }
    } else if (
      route.params?.mainConversationWithPeer &&
      !openedMainConvo.current
    ) {
      logger.debug("[Conversation] Opening main conversation with peer", {
        peer: route.params.mainConversationWithPeer,
      });
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
      logger.debug(
        "[Conversation] Conversation not active, navigating back to Chats"
      );
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
    () => route.params?.text || conversation?.messageDraft || "",
    [conversation?.messageDraft, route.params?.text]
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
      logger.debug("[Conversation] Automatically focusing text input");
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
          logger.debug(
            "[Conversation] Automatically focusing text input after transition"
          );
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
    logger.debug("[Conversation] Setting navigation options", {
      peerAddress,
      isBlockedPeer,
    });
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
      logger.debug("[Conversation] Setting conversation as opened and read", {
        topic: conversation.topic,
      });
      useChatStore.getState().setOpenedConversationTopic(conversation.topic);

      logger.debug("[Conversation] Loading older messages", {
        topic: conversation.topic,
      });
      loadOlderMessages(currentAccount(), conversation.topic);

      if (topicToNavigateTo === conversation.topic) {
        logger.debug("[Conversation] Resetting topic to navigate to");
        setTopicToNavigateTo("");
      }
    }
  }, [conversation]);

  const onLeaveScreen = useCallback(async () => {
    if (!conversation) return;

    logger.debug(
      "[Conversation] Leaving screen, saving draft and media preview",
      {
        topic: conversation.topic,
      }
    );
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
        logger.debug(
          "[Conversation] Opening new conversation, saving current",
          {
            currentTopic: conversationTopic,
            newTopic: topic,
          }
        );
        onLeaveScreen();
      }
    },
    [conversationTopic, onLeaveScreen]
  );

  useEffect(() => {
    logger.debug("[Conversation] Setting up navigation listeners");
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

  const conversationContextValue = useMemo(
    () => ({
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
      tagsFetchedOnceForMessage,
    }),
    [
      conversation,
      messageToPrefill,
      textInputRef,
      mediaPreviewToPrefill,
      mediaPreviewRef,
      isBlockedPeer,
      onReadyToFocus,
      transactionMode,
      setTransactionMode,
      frameTextInputFocused,
      setFrameTextInputFocused,
      tagsFetchedOnceForMessage,
    ]
  );

  logger.debug("[Conversation] Rendering conversation component", {
    hasTopic: !!route.params?.topic,
    hasMainConversationWithPeer: !!route.params?.mainConversationWithPeer,
  });

  return (
    <View style={styles.container} key={`conversation-${colorScheme}`}>
      {route.params?.topic || route.params?.mainConversationWithPeer ? (
        <ConversationContext.Provider value={conversationContextValue}>
          <Chat />
        </ConversationContext.Provider>
      ) : (
        <View style={styles.filler} />
      )}
      <EmojiPicker />
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
