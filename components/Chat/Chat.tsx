import { FlashList } from "@shopify/flash-list";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import { MutableRefObject, useContext, useEffect, useState } from "react";
import {
  ColorSchemeName,
  useColorScheme,
  InputAccessoryView,
  View,
  StyleSheet,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppContext } from "../../data/store/context";
import { XmtpConversationWithUpdate } from "../../data/store/xmtpReducer";
import { backgroundColor, tertiaryBackgroundColor } from "../../utils/colors";
import { CONVERSE_INVISIBLE_CHAR } from "../../utils/xmtp/messages";
import ChatInput from "./ChatInput";
import ChatMessage, { MessageToDisplay } from "./ChatMessage";

type Props = {
  conversation?: XmtpConversationWithUpdate;
  xmtpAddress?: string;
  setInputValue: (value: string) => void;
  inputValue: string;
  inputRef: MutableRefObject<TextInput | undefined>;
  sendMessage: (content: string) => Promise<void>;
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
}: Props) {
  const { state } = useContext(AppContext);
  const colorScheme = useColorScheme();
  const [
    automaticallyAdjustKeyboardInsets,
    setAutomaticallyAdjustKeyboardInsets,
  ] = useState(false);
  const [chatInputHeight, setChatInputHeight] = useState(36);

  const styles = getStyles(colorScheme);
  const [messagesArray, setMessagesArray] = useState(
    getMessagesArray(xmtpAddress, conversation)
  );
  useEffect(() => {
    setMessagesArray(getMessagesArray(xmtpAddress, conversation));
  }, [conversation, conversation?.lastUpdateAt, xmtpAddress]);
  const insets = useSafeAreaInsets();
  const minAccessoryHeight = chatInputHeight + insets.bottom + 14;
  // console.log(minAccessoryHeight, chatInputHeight + insets.bottom + 14);
  const chatInput = (
    <ChatInput
      inputValue={inputValue}
      setInputValue={setInputValue}
      chatInputHeight={chatInputHeight}
      setChatInputHeight={setChatInputHeight}
      inputRef={inputRef}
      sendMessage={sendMessage}
    />
  );
  return (
    <View style={styles.chatContainer}>
      <FlashList
        contentContainerStyle={styles.chat}
        data={messagesArray}
        renderItem={({ item }) => <ChatMessage message={item} />}
        onLayout={() => {
          if (!automaticallyAdjustKeyboardInsets) {
            setTimeout(() => {
              setAutomaticallyAdjustKeyboardInsets(true);
            }, 50);
          }
        }}
        estimatedItemSize={100}
        keyboardDismissMode="interactive"
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 100,
        }}
        inverted
        automaticallyAdjustKeyboardInsets={
          automaticallyAdjustKeyboardInsets && !state.app.showingActionSheet
        }
        keyExtractor={(item) => item.id}
      />
      <View
        style={{
          backgroundColor: tertiaryBackgroundColor(colorScheme),
          height: minAccessoryHeight,
        }}
      >
        <InputAccessoryView
          backgroundColor={tertiaryBackgroundColor(colorScheme)}
        >
          {chatInput}
        </InputAccessoryView>
        {/* {chatInput} */}
        {/* {Platform.OS === "ios" && false && (
          <InputAccessoryView backgroundColor={backgroundColor(colorScheme)}>
            {chatInput}
          </InputAccessoryView>
        )}
        {Platform.OS === "ios" && chatInput} */}
      </View>
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    chatContainer: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
    chat: {
      backgroundColor: backgroundColor(colorScheme),
    },
  });
