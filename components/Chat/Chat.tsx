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
import Reanimated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { XmtpConversationWithUpdate } from "../../data/store/xmtpReducer";
import { useKeyboardAnimation } from "../../utils/animations";
import { backgroundColor, tertiaryBackgroundColor } from "../../utils/colors";
import { CONVERSE_INVISIBLE_CHAR } from "../../utils/xmtp/messages";
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
    message.sentViaConverse = message.content.endsWith(CONVERSE_INVISIBLE_CHAR);
    message.messageToDisplay = message.sentViaConverse
      ? message.content.slice(0, message.content.length - 1)
      : message.content;
    message.fromMe =
      !!xmtpAddress &&
      xmtpAddress.toLowerCase() === message.senderAddress.toLowerCase();

    message.lastMessageInSeries = true;
    if (index < messagesArray.length - 1) {
      const nextMessage = messagesArray[index + 1];
      if (nextMessage.senderAddress === message.senderAddress) {
        message.lastMessageInSeries = false;
      }
    }
    if (index > 0) {
      const previousMessage = messagesArray[index - 1];
      message.dateChange =
        differenceInCalendarDays(message.sent, previousMessage.sent) > 0;
    } else {
      message.dateChange = true;
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

  // Saving the chat input height to a var to adapt
  const [chatInputHeight, setChatInputHeight] = useState(36);

  const insets = useSafeAreaInsets();

  const { height: keyboardHeight } = useKeyboardAnimation();

  const [inputFocused, setInputFocused] = useState(false);
  const bottomInset = inputFocused ? 0 : insets.bottom;
  const tertiary = tertiaryBackgroundColor(colorScheme);

  const showChatInput = !!(conversation && !isBlockedPeer);

  const totalChatInputHeight = showChatInput
    ? chatInputHeight + 14 + bottomInset
    : 0;

  const textInputStyle = useAnimatedStyle(
    () => ({
      position: "absolute",
      // height: chatInputHeight + 14 + bottomInset,
      width: "100%",
      backgroundColor: tertiary,
      transform: [{ translateY: -keyboardHeight.value }],
    }),
    [keyboardHeight, tertiary]
  );

  const chatContentStyle = useAnimatedStyle(
    () => ({
      ...styles.chatContent,
      paddingBottom: keyboardHeight.value + totalChatInputHeight,
    }),
    [totalChatInputHeight, keyboardHeight]
  );

  const showPlaceholder =
    messagesArray.length === 0 || isBlockedPeer || !conversation;

  return (
    <View style={styles.chatContainer}>
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
        <AnimatedView
          style={[
            textInputStyle,
            { height: chatInputHeight + 14 + bottomInset },
          ]}
        >
          <ChatInput
            inputValue={inputValue}
            setInputValue={setInputValue}
            chatInputHeight={chatInputHeight}
            setChatInputHeight={setChatInputHeight}
            inputRef={inputRef}
            sendMessage={sendMessage}
            onBlur={() => setInputFocused(false)}
            onFocus={() => setInputFocused(true)}
          />
        </AnimatedView>
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
  });
