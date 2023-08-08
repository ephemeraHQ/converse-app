import { FlashList } from "@shopify/flash-list";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import React, { useCallback, useRef, useMemo } from "react";
import {
  View,
  useColorScheme,
  StyleSheet,
  FlatList,
  Platform,
} from "react-native";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useProfilesStore,
  useRecommendationsStore,
  useUserStore,
} from "../../data/store/accountsStore";
import { XmtpConversationWithUpdate } from "../../data/store/chatStore";
import { useConversationContext } from "../../screens/Conversation";
import { useKeyboardAnimation } from "../../utils/animations";
import {
  backgroundColor,
  itemSeparatorColor,
  tertiaryBackgroundColor,
} from "../../utils/colors";
import { getProfileData } from "../../utils/profile";
import { Recommendation } from "../Recommendations";
import ChatInput from "./ChatInput";
import CachedChatMessage, { MessageToDisplay } from "./ChatMessage";
import ChatPlaceholder from "./ChatPlaceholder";

const AnimatedView = Reanimated.createAnimatedComponent(View);
const AnimatedFlatList = Reanimated.createAnimatedComponent(
  FlatList
) as typeof FlatList;
const AnimatedFlashList = Reanimated.createAnimatedComponent(
  FlashList
) as typeof FlashList;

const getListArray = (
  xmtpAddress?: string,
  conversation?: XmtpConversationWithUpdate
) => {
  if (!conversation) return [];
  const messagesArray = Array.from(conversation.messages.values());
  const reverseArray = [];
  for (let index = messagesArray.length - 1; index >= 0; index--) {
    const message = messagesArray[index] as MessageToDisplay;
    // Reactions are not displayed in the flow
    if (message.contentType.startsWith("xmtp.org/reaction:")) continue;
    message.fromMe =
      !!xmtpAddress &&
      xmtpAddress.toLowerCase() === message.senderAddress.toLowerCase();

    message.hasNextMessageInSeries = false;
    message.hasPreviousMessageInSeries = false;

    if (index > 0) {
      const previousMessage = messagesArray[index - 1];
      message.dateChange =
        differenceInCalendarDays(message.sent, previousMessage.sent) > 0;
      if (
        previousMessage.senderAddress === message.senderAddress &&
        !message.dateChange
      ) {
        message.hasPreviousMessageInSeries = true;
      }
    } else {
      message.dateChange = true;
    }

    if (index < messagesArray.length - 1) {
      const nextMessage = messagesArray[index + 1];
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
    reverseArray.push(message);
  }
  reverseArray.push({ id: "converse-recommendations" } as MessageToDisplay);
  return reverseArray;
};

export default function Chat() {
  const { conversation, isBlockedPeer, onReadyToFocus } =
    useConversationContext(["conversation", "isBlockedPeer", "onReadyToFocus"]);
  const xmtpAddress = useUserStore((s) => s.userAddress);
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

  const { height: _keyboardHeight } = useKeyboardAnimation();
  const zeroValue = useSharedValue(0);
  const keyboardHeight =
    Platform.OS === "android" ? zeroValue : _keyboardHeight;

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

  const showPlaceholder =
    listArray.length === 1 || isBlockedPeer || !conversation;
  const renderItem = useCallback(
    ({ item }: { item: MessageToDisplay }) => {
      if (item.id === "converse-recommendations") {
        const recommendationData = getProfileData(
          recommendationsData,
          peerSocials
        );
        if (!recommendationData || !conversation?.peerAddress) return null;
        return (
          <View style={styles.inChatRecommendations}>
            <Recommendation
              recommendationData={recommendationData}
              address={conversation.peerAddress}
              embedInChat
            />
          </View>
        );
      } else {
        return (
          <CachedChatMessage message={{ ...item }} colorScheme={colorScheme} />
        );
      }
    },
    [
      conversation?.peerAddress,
      peerSocials,
      recommendationsData,
      styles.inChatRecommendations,
      colorScheme,
    ]
  );
  const keyExtractor = useCallback((item: MessageToDisplay) => item.id, []);

  // This is a small hack - for pending convos we use FlatList,
  // for "real" convos we use FlashList, because the replacement
  // of id of the element in the FlashList without changing
  // the list size makes it buggy (cropped), especially on Android
  const pendingConversationRef = useRef(
    !(conversation && !conversation.pending)
  );

  const AnimatedListView = pendingConversationRef.current
    ? AnimatedFlatList
    : AnimatedFlashList;

  return (
    <View
      style={styles.chatContainer}
      key={`chat-${conversation?.peerAddress}-${conversation?.context?.conversationId}-${isBlockedPeer}`}
    >
      <AnimatedView style={chatContentStyle}>
        {conversation && listArray.length > 1 && !isBlockedPeer && (
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
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 100,
            }}
            inverted
            keyExtractor={keyExtractor}
            keyboardShouldPersistTaps="handled"
            estimatedItemSize={80}
          />
        )}
        {showPlaceholder && (
          <ChatPlaceholder messagesCount={listArray.length - 1} />
        )}
      </AnimatedView>
      {showChatInput && (
        <>
          <AnimatedView
            style={textInputStyle}
            onLayout={(e) => {
              chatInputHeight.value = e.nativeEvent.layout.height;
            }}
          >
            <ChatInput />
          </AnimatedView>
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
      backgroundColor: tertiaryBackgroundColor(colorScheme),
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
