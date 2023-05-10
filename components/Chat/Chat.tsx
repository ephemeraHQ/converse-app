import { FlashList } from "@shopify/flash-list";
import {
  MutableRefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ColorSchemeName,
  useColorScheme,
  InputAccessoryView,
  View,
  Platform,
  StyleSheet,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppContext } from "../../data/store/context";
import { XmtpConversationWithUpdate } from "../../data/store/xmtpReducer";
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
      const previousMessage = messagesArray[index + 1];
      if (previousMessage.senderAddress === message.senderAddress) {
        message.lastMessageInSeries = false;
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
}: Props) {
  const { state } = useContext(AppContext);
  const colorScheme = useColorScheme();
  const [
    automaticallyAdjustKeyboardInsets,
    setAutomaticallyAdjustKeyboardInsets,
  ] = useState(false);
  const [chatInputHeight, setChatInputHeight] = useState(25);

  const styles = getStyles(colorScheme);
  const [messagesArray, setMessagesArray] = useState(
    getMessagesArray(xmtpAddress, conversation)
  );
  useEffect(() => {
    setMessagesArray(getMessagesArray(xmtpAddress, conversation));
  }, [conversation, conversation?.lastUpdateAt, xmtpAddress]);
  const insets = useSafeAreaInsets();
  const minAccessoryHeight = useRef(chatInputHeight + insets.bottom);
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
          backgroundColor: "red",
          height: minAccessoryHeight.current,
        }}
      >
        {Platform.OS === "ios" && (
          <InputAccessoryView backgroundColor="blue">
            {chatInput}
          </InputAccessoryView>
        )}
        {Platform.OS !== "ios" && chatInput}
      </View>
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    chatContainer: {
      flex: 1,
      backgroundColor: "green",
    },
    chat: {
      backgroundColor: "yellow",
    },
  });
