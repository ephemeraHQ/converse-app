import { FlashList } from "@shopify/flash-list";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";
import {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useCurrentAccount,
  useProfilesStore,
  useRecommendationsStore,
} from "../../data/store/accountsStore";
import { XmtpConversationWithUpdate } from "../../data/store/chatStore";
import { useFramesStore } from "../../data/store/framesStore";
import { useIsSplitScreen } from "../../screens/Navigation/navHelpers";
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
import { converseEventEmitter } from "../../utils/events";
import { getProfileData } from "../../utils/profile";
import { isContentType } from "../../utils/xmtpRN/contentTypes";
import { Recommendation } from "../Recommendations/Recommendation";
import ChatPlaceholder from "./ChatPlaceholder";
import ConsentPopup from "./ConsentPopup";
import ChatInput from "./Input/Input";
import CachedChatMessage, { MessageToDisplay } from "./Message/Message";
import TransactionInput from "./Transaction/TransactionInput";

const getListArray = (
  xmtpAddress?: string,
  conversation?: XmtpConversationWithUpdate
) => {
  if (!conversation) return [];
  const reverseArray = [];
  // Filter out unwanted content types before list or reactions out of order can mess up the logic
  const filteredMessageIds = conversation.messagesIds.filter((messageId) => {
    const message = conversation.messages.get(messageId) as MessageToDisplay;
    if (!message || (!message.content && !message.contentFallback))
      return false;

    // Reactions & read receipts are not displayed in the flow
    const notDisplayedContentTypes = [
      "xmtp.org/reaction:",
      "xmtp.org/readReceipt:",
    ];
    return !notDisplayedContentTypes.some((c) =>
      message.contentType.startsWith(c)
    );
  });

  for (let index = filteredMessageIds.length - 1; index >= 0; index--) {
    const messageId = filteredMessageIds[index];
    const message = conversation.messages.get(messageId) as MessageToDisplay;

    message.fromMe =
      !!xmtpAddress &&
      xmtpAddress.toLowerCase() === message.senderAddress.toLowerCase();

    message.hasNextMessageInSeries = false;
    message.hasPreviousMessageInSeries = false;

    if (index > 0) {
      const previousMessageId = filteredMessageIds[index - 1];
      const previousMessage = conversation.messages.get(previousMessageId);
      if (previousMessage) {
        message.dateChange =
          differenceInCalendarDays(message.sent, previousMessage.sent) > 0;
        if (
          previousMessage.senderAddress === message.senderAddress &&
          !message.dateChange &&
          !isContentType("groupUpdated", previousMessage.contentType)
        ) {
          message.hasPreviousMessageInSeries = true;
        }
      }
    } else {
      message.dateChange = true;
    }

    if (index < filteredMessageIds.length - 1) {
      const nextMessageId = filteredMessageIds[index + 1];
      const nextMessage = conversation.messages.get(nextMessageId);
      if (nextMessage) {
        // Here we need to check if next message has a date change
        const nextMessageDateChange =
          differenceInCalendarDays(nextMessage.sent, message.sent) > 0;
        if (
          nextMessage.senderAddress === message.senderAddress &&
          !nextMessageDateChange &&
          !isContentType("reaction", nextMessage.contentType) &&
          !isContentType("groupUpdated", nextMessage.contentType)
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
  const {
    conversation,
    isBlockedPeer,
    onReadyToFocus,
    transactionMode,
    frameTextInputFocused,
    onPullToRefresh,
  } = useConversationContext([
    "conversation",
    "isBlockedPeer",
    "onReadyToFocus",
    "transactionMode",
    "frameTextInputFocused",
    "onPullToRefresh",
  ]);
  const xmtpAddress = useCurrentAccount() as string;
  const peerSocials = useProfilesStore((s) =>
    conversation?.peerAddress
      ? s.profiles[conversation.peerAddress]?.socials
      : undefined
  );
  const isSplitScreen = useIsSplitScreen();
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

  const hideInputIfFrameFocused = Platform.OS !== "web";

  const DEFAULT_INPUT_HEIGHT = 36;
  const chatInputHeight = useSharedValue(50);
  const chatInputDisplayedHeight = useDerivedValue(() => {
    return frameTextInputFocused && hideInputIfFrameFocused
      ? 0
      : chatInputHeight.value;
  });

  const insets = useSafeAreaInsets();

  const { height: keyboardHeight } = useKeyboardAnimation();
  const tertiary = tertiaryBackgroundColor(colorScheme);

  const showChatInput = !!(
    conversation &&
    !isBlockedPeer &&
    (!conversation.isGroup ||
      conversation.groupMembers.includes(xmtpAddress.toLowerCase()))
  );

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
        ? chatInputDisplayedHeight.value +
          Math.max(insets.bottom, keyboardHeight.value)
        : insets.bottom,
    }),
    [showChatInput, keyboardHeight, chatInputDisplayedHeight, insets.bottom]
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
  const framesStore = useFramesStore().frames;

  const showPlaceholder =
    listArray.length === 0 || isBlockedPeer || !conversation;
  const renderItem = useCallback(
    ({ item }: { item: MessageToDisplay }) => {
      return (
        <CachedChatMessage
          account={xmtpAddress}
          message={{ ...item }}
          colorScheme={colorScheme}
          isGroup={!!conversation?.isGroup}
          isFrame={!!framesStore[item.content.toLowerCase()]}
        />
      );
    },
    [colorScheme, xmtpAddress, conversation?.isGroup, framesStore]
  );
  const keyExtractor = useCallback((item: MessageToDisplay) => item.id, []);

  // The first message was really buggy on iOS & Android and this is due to FlashList
  // so we keep FlatList for new convos and switch to FlashList for bigger convos
  // that need great perf.
  const conversationNotPendingRef = useRef(
    conversation && !conversation.pending
  );
  const AnimatedListView =
    conversationNotPendingRef.current && Platform.OS !== "web"
      ? ReanimatedFlashList
      : ReanimatedFlatList;

  const messageListRef = useRef<
    FlatList<MessageToDisplay> | FlashList<MessageToDisplay> | undefined
  >();

  const scrollToMessage = useCallback(
    (data: {
      messageId: string | undefined;
      index: number | undefined;
      animated: boolean | undefined;
    }) => {
      let index = data.index;
      if (index === undefined && data.messageId) {
        index = listArray.findIndex((m) => m.id === data.messageId);
      }
      if (index !== undefined) {
        messageListRef.current?.scrollToIndex({
          index,
          viewPosition: 0.5,
          animated: !!data.animated,
        });
      }
    },
    [listArray]
  );

  useEffect(() => {
    converseEventEmitter.on("scrollChatToMessage", scrollToMessage);
    return () => {
      converseEventEmitter.off("scrollChatToMessage", scrollToMessage);
    };
  }, [scrollToMessage]);

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
            onRefresh={onPullToRefresh}
            refreshing={conversation?.pending}
            extraData={[peerSocials]}
            renderItem={renderItem}
            onLayout={() => {
              setTimeout(() => {
                onReadyToFocus();
              }, 50);
            }}
            ref={(r) => {
              if (r) {
                messageListRef.current = r;
              }
            }}
            keyboardDismissMode="interactive"
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
            // Causes a glitch on Android, no sure we need it for now
            // maintainVisibleContentPosition={{
            //   minIndexForVisible: 0,
            //   autoscrollToTopThreshold: 100,
            // }}
            estimatedListSize={
              isSplitScreen ? undefined : Dimensions.get("screen")
            }
            inverted
            keyExtractor={keyExtractor}
            getItemType={(item: MessageToDisplay) => item.contentType}
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
        <ConsentPopup />
      </ReanimatedView>
      {showChatInput && (
        <>
          <ReanimatedView
            style={[
              textInputStyle,
              {
                display:
                  frameTextInputFocused && hideInputIfFrameFocused
                    ? "none"
                    : "flex",
              },
            ]}
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
