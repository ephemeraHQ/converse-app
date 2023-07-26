import { FlashList } from "@shopify/flash-list";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import React, {
  MutableRefObject,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import {
  View,
  TextInput,
  useColorScheme,
  StyleSheet,
  ColorSchemeName,
} from "react-native";
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppContext } from "../../data/store/context";
import { XmtpConversationWithUpdate } from "../../data/store/xmtpReducer";
import { useKeyboardAnimation } from "../../utils/animations";
import {
  backgroundColor,
  itemSeparatorColor,
  tertiaryBackgroundColor,
} from "../../utils/colors";
import { Recommendation } from "../Recommendations";
import ChatInput from "./ChatInput";
import ChatMessage, { MessageToDisplay } from "./ChatMessage";
import ChatPlaceholder from "./ChatPlaceholder";

const AnimatedView = Reanimated.createAnimatedComponent(View);
const AnimatedFlashList = Reanimated.createAnimatedComponent(
  FlashList
) as typeof FlashList;

type Props = {
  conversation?: XmtpConversationWithUpdate;
  xmtpAddress?: string;
  setInputValue: (value: string) => void;
  inputValue: string;
  inputRef: MutableRefObject<TextInput | undefined>;
  sendMessage: (content: string, contentType?: string) => Promise<void>;
  isBlockedPeer: boolean;
  onReadyToFocus: () => void;
};

const getFlashlistArray = (
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

export default function Chat({
  conversation,
  xmtpAddress,
  setInputValue,
  inputValue,
  inputRef,
  sendMessage,
  isBlockedPeer,
  onReadyToFocus,
}: Props) {
  const { state } = useContext(AppContext);
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const [flashListArray, setFlashListArray] = useState(
    getFlashlistArray(xmtpAddress, conversation)
  );
  useEffect(() => {
    setFlashListArray(getFlashlistArray(xmtpAddress, conversation));
  }, [conversation, conversation?.lastUpdateAt, xmtpAddress]);

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

  const showPlaceholder =
    flashListArray.length === 1 || isBlockedPeer || !conversation;
  const renderItem = useCallback(
    ({ item }: { item: MessageToDisplay }) => {
      if (item.id === "converse-recommendations") {
        const recommendationData = conversation?.peerAddress
          ? state.recommendations?.frens?.[conversation.peerAddress]
          : undefined;
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
        return <ChatMessage message={item} sendMessage={sendMessage} />;
      }
    },
    [
      conversation?.peerAddress,
      sendMessage,
      state.recommendations?.frens,
      styles.inChatRecommendations,
    ]
  );
  const keyExtractor = useCallback((item: MessageToDisplay) => item.id, []);

  return (
    <View
      style={styles.chatContainer}
      key={`chat-${conversation?.topic}-${isBlockedPeer}`}
    >
      <AnimatedView style={chatContentStyle}>
        {conversation && flashListArray.length > 1 && !isBlockedPeer && (
          <AnimatedFlashList
            contentContainerStyle={styles.chat}
            data={flashListArray}
            renderItem={renderItem}
            onLayout={() => {
              setTimeout(() => {
                onReadyToFocus();
              }, 50);
            }}
            estimatedItemSize={80}
            keyboardDismissMode="interactive"
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 100,
            }}
            inverted
            keyExtractor={keyExtractor}
          />
        )}
        {showPlaceholder && (
          <ChatPlaceholder
            onReadyToFocus={onReadyToFocus}
            isBlockedPeer={isBlockedPeer}
            conversation={conversation}
            messagesCount={flashListArray.length - 1}
            sendMessage={sendMessage}
          />
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
            <ChatInput
              inputValue={inputValue}
              setInputValue={setInputValue}
              inputRef={inputRef}
              sendMessage={sendMessage}
            />
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

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
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
