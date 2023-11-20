import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import React, { useCallback, useMemo, useRef } from "react";
import { View, useColorScheme, StyleSheet, Platform } from "react-native";
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useCurrentAccount,
  useProfilesStore,
  useRecommendationsStore,
} from "../../data/store/accountsStore";
import { XmtpConversationWithUpdate } from "../../data/store/chatStore";
import {
  ReanimatedFlashList,
  ReanimatedFlatList,
  ReanimatedView,
} from "../../utils/animations";
import { useKeyboardAnimation } from "../../utils/animations/keyboardAnimation";
import {
  backgroundColor,
  itemSeparatorColor,
  tertiaryBackgroundColor,
} from "../../utils/colors";
import { useConversationContext } from "../../utils/conversation";
import { getProfileData } from "../../utils/profile";
import { Recommendation } from "../Recommendations/Recommendation";
import ChatConsent from "./ChatConsent";
import ChatInput from "./ChatInput";
import CachedChatMessage, { MessageToDisplay } from "./ChatMessage";
import ChatPlaceholder from "./ChatPlaceholder";
import TransactionInput from "./TransactionInput";

const getListArray = (
  xmtpAddress?: string,
  conversation?: XmtpConversationWithUpdate
) => {
  if (!conversation) return [];
  const reverseArray = [];
  for (let index = conversation.messagesIds.length - 1; index >= 0; index--) {
    const messageId = conversation.messagesIds[index];
    const message = conversation.messages.get(messageId) as MessageToDisplay;
    // Reactions & read receipts are not displayed in the flow
    const notDisplayedContentTypes = [
      "xmtp.org/reaction:",
      "xmtp.org/readReceipt:",
    ];
    if (notDisplayedContentTypes.some((c) => message.contentType.startsWith(c)))
      continue;
    message.fromMe =
      !!xmtpAddress &&
      xmtpAddress.toLowerCase() === message.senderAddress.toLowerCase();

    message.hasNextMessageInSeries = false;
    message.hasPreviousMessageInSeries = false;

    if (index > 0) {
      const previousMessageId = conversation.messagesIds[index - 1];
      const previousMessage = conversation.messages.get(previousMessageId);
      if (previousMessage) {
        message.dateChange =
          differenceInCalendarDays(message.sent, previousMessage.sent) > 0;
        if (
          previousMessage.senderAddress === message.senderAddress &&
          !message.dateChange &&
          !previousMessage.contentType.startsWith("xmtp.org/reaction:")
        ) {
          message.hasPreviousMessageInSeries = true;
        }
      }
    } else {
      message.dateChange = true;
    }

    if (index < conversation.messagesIds.length - 1) {
      const nextMessageId = conversation.messagesIds[index + 1];
      const nextMessage = conversation.messages.get(nextMessageId);
      if (nextMessage) {
        // Here we need to check if next message has a date change
        const nextMessageDateChange =
          differenceInCalendarDays(nextMessage.sent, message.sent) > 0;
        if (
          nextMessage.senderAddress === message.senderAddress &&
          !nextMessageDateChange &&
          !nextMessage.contentType.startsWith("xmtp.org/reaction:")
        ) {
          message.hasNextMessageInSeries = true;
        }
      }
    }
    reverseArray.push(message);
  }
  return reverseArray;
};

export default function Chat() {
  const { conversation, isBlockedPeer, onReadyToFocus, transactionMode } =
    useConversationContext([
      "conversation",
      "isBlockedPeer",
      "onReadyToFocus",
      "transactionMode",
    ]);
  const xmtpAddress = useCurrentAccount() as string;
  const peerSocials = useProfilesStore((s) =>
    conversation?.peerAddress
      ? s.profiles[conversation.peerAddress]?.socials
      : undefined
  );
  const recommendationsData = useRecommendationsStore((s) =>
    conversation?.peerAddress ? s.frens[conversation.peerAddress] : undefined
  );
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const listArray = useMemo(
    () => getListArray(xmtpAddress, conversation),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [xmtpAddress, conversation, conversation?.lastUpdateAt]
  );

  const DEFAULT_INPUT_HEIGHT = 36;
  const chatInputHeight = useSharedValue(50);

  const insets = useSafeAreaInsets();

  const { height: keyboardHeight } = useKeyboardAnimation();
  const tertiary = tertiaryBackgroundColor(colorScheme);

  const showChatInput = !!(conversation && !isBlockedPeer);

  const textInputStyle = useAnimatedStyle(
    () => ({
      position: "absolute",
      width: "100%",
      backgroundColor: tertiary,
      height: "auto",
      zIndex: 1,
      transform: [
        { translateY: -Math.max(insets.bottom, keyboardHeight.value) },
      ] as any,
    }),
    [keyboardHeight, tertiary, insets.bottom]
  );

  const chatContentStyle = useAnimatedStyle(
    () => ({
      ...styles.chatContent,
      paddingBottom: showChatInput
        ? Math.max(
            chatInputHeight.value + insets.bottom,
            keyboardHeight.value + chatInputHeight.value
          )
        : 0,
    }),
    [showChatInput, keyboardHeight, chatInputHeight, insets.bottom]
  );

  const ListFooterComponent = useMemo(() => {
    const recommendationData = getProfileData(recommendationsData, peerSocials);
    if (!recommendationData || !conversation?.peerAddress) return null;
    return (
      <View style={styles.inChatRecommendations}>
        <Recommendation
          recommendationData={recommendationData}
          address={conversation.peerAddress}
          embedInChat
          isVisible
        />
      </View>
    );
  }, [
    conversation?.peerAddress,
    peerSocials,
    recommendationsData,
    styles.inChatRecommendations,
  ]);

  const showPlaceholder =
    listArray.length === 0 || isBlockedPeer || !conversation;
  const renderItem = useCallback(
    ({ item }: { item: MessageToDisplay }) => {
      return (
        <CachedChatMessage
          account={xmtpAddress}
          message={{ ...item }}
          colorScheme={colorScheme}
        />
      );
    },
    [colorScheme, xmtpAddress]
  );
  const keyExtractor = useCallback((item: MessageToDisplay) => item.id, []);

  // The first message was really buggy on iOS & Android and this is due to FlashList
  // so we keep FlatList for new convos and switch to FlashList for bigger convos
  // that need great perf.
  const conversationNotPendingRef = useRef(
    conversation && !conversation.pending
  );
  const AnimatedListView = conversationNotPendingRef.current
    ? ReanimatedFlashList
    : ReanimatedFlatList;

  return (
    <View
      style={styles.chatContainer}
      key={`chat-${conversation?.peerAddress}-${
        conversation?.context?.conversationId || ""
      }-${isBlockedPeer}`}
    >
      <ReanimatedView style={chatContentStyle}>
        {conversation && listArray.length > 0 && !isBlockedPeer && (
          <AnimatedListView
            contentContainerStyle={styles.chat}
            data={listArray}
            extraData={[peerSocials]}
            renderItem={renderItem}
            onLayout={() => {
              setTimeout(() => {
                onReadyToFocus();
              }, 50);
            }}
            keyboardDismissMode="interactive"
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
            // Causes a glitch on Android, no sure we need it for now
            // maintainVisibleContentPosition={{
            //   minIndexForVisible: 0,
            //   autoscrollToTopThreshold: 100,
            // }}
            inverted
            keyExtractor={keyExtractor}
            keyboardShouldPersistTaps="handled"
            estimatedItemSize={80}
            // Size glitch on Android
            showsVerticalScrollIndicator={Platform.OS === "ios"}
            ListFooterComponent={ListFooterComponent}
          />
        )}
        {showPlaceholder && (
          <ChatPlaceholder messagesCount={listArray.length} />
        )}
        <ChatConsent />
      </ReanimatedView>
      {showChatInput && (
        <>
          <ReanimatedView
            style={textInputStyle}
            onLayout={(e) => {
              chatInputHeight.value = e.nativeEvent.layout.height;
            }}
          >
            {!transactionMode && <ChatInput />}
            {transactionMode && <TransactionInput />}
          </ReanimatedView>
          <View
            style={[
              styles.inputBottomFiller,
              { height: insets.bottom + DEFAULT_INPUT_HEIGHT },
            ]}
          />
        </>
      )}
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    chatContainer: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: backgroundColor(colorScheme),
    },
    chatContent: {
      backgroundColor: backgroundColor(colorScheme),
      flex: 1,
    },
    chat: {
      backgroundColor: backgroundColor(colorScheme),
    },
    inputBottomFiller: {
      position: "absolute",
      width: "100%",
      bottom: 0,
      backgroundColor: backgroundColor(colorScheme),
      zIndex: 0,
    },
    inChatRecommendations: {
      borderBottomWidth: 0.5,
      borderBottomColor: itemSeparatorColor(colorScheme),
      marginHorizontal: 20,
      marginBottom: 10,
    },
  });
};
