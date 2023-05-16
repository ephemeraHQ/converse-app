import { FlashList } from "@shopify/flash-list";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import React, { MutableRefObject, useState, useEffect } from "react";
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

import { XmtpConversationWithUpdate } from "../../data/store/xmtpReducer";
import { useKeyboardAnimation } from "../../utils/animations";
import { backgroundColor, tertiaryBackgroundColor } from "../../utils/colors";
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
  sendMessage: (content: string) => Promise<void>;
  isBlockedPeer: boolean;
  onReadyToFocus: () => void;
};

const getMessagesArray = (
  xmtpAddress?: string,
  conversation?: XmtpConversationWithUpdate
) => {
  if (!conversation) return [];
  const messagesArray = Array.from(conversation.messages.values());
  const reverseArray = [];
  for (let index = messagesArray.length - 1; index >= 0; index--) {
    const message = messagesArray[index] as MessageToDisplay;
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
        !nextMessageDateChange
      ) {
        message.hasNextMessageInSeries = true;
      }
    }
    reverseArray.push(message);
  }
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
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const [messagesArray, setMessagesArray] = useState(
    getMessagesArray(xmtpAddress, conversation)
  );
  useEffect(() => {
    setMessagesArray(getMessagesArray(xmtpAddress, conversation));
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
      ],
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
    messagesArray.length === 0 || isBlockedPeer || !conversation;

  return (
    <View
      style={styles.chatContainer}
      key={`chat-${conversation?.topic}-${isBlockedPeer}`}
    >
      <AnimatedView style={chatContentStyle}>
        {conversation && messagesArray.length > 0 && !isBlockedPeer && (
          <AnimatedFlashList
            contentContainerStyle={styles.chat}
            data={messagesArray}
            renderItem={({ item }) => <ChatMessage message={item} />}
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
            keyExtractor={(item) => item.id}
          />
        )}
        {showPlaceholder && (
          <ChatPlaceholder
            onReadyToFocus={onReadyToFocus}
            isBlockedPeer={isBlockedPeer}
            conversation={conversation}
            messagesCount={messagesArray.length}
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
  });
