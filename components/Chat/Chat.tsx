import { FlashList } from "@shopify/flash-list";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
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
  StyleSheet,
  TextInput,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppContext } from "../../data/store/context";
import { XmtpConversationWithUpdate } from "../../data/store/xmtpReducer";
import { backgroundColor, tertiaryBackgroundColor } from "../../utils/colors";
import { CONVERSE_INVISIBLE_CHAR } from "../../utils/xmtp/messages";
import ChatInput from "./ChatInput";
import ChatMessage, { MessageToDisplay } from "./ChatMessage";
import ChatPlaceholder from "./ChatPlaceholder";

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
  const { state } = useContext(AppContext);
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const [messagesArray, setMessagesArray] = useState(
    getMessagesArray(xmtpAddress, conversation)
  );
  useEffect(() => {
    setMessagesArray(getMessagesArray(xmtpAddress, conversation));
  }, [conversation, conversation?.lastUpdateAt, xmtpAddress]);

  // Adjusting keyboard insets after layout to avoid
  // scrolling bug
  const [
    automaticallyAdjustKeyboardInsets,
    setAutomaticallyAdjustKeyboardInsets,
  ] = useState(false);

  // Saving the chat input height to a var to adapt
  const [chatInputHeight, setChatInputHeight] = useState(36);

  const insets = useSafeAreaInsets();
  const accessoryHeight = chatInputHeight + insets.bottom + 14;

  // Saving scroll position to scroll to 0 if near 0 when
  // closing the keyboard
  const scrollPosition = useRef(0);

  // Duplicating the chat input, one that is shown at the beginning
  // and another one that is show above keyboard as an accessory view
  const [showChatInputBehindKeyboard, setShowChatInputBehindKeyboard] =
    useState(true);
  const inputAboveKeyboardRef = useRef<TextInput | undefined>(undefined);

  // This one is show at the beginning, and when user clicks on it
  // the other one is sticked above the keyboard
  const chatInputBehindKeyboard = (
    <ChatInput
      inputValue={inputValue}
      setInputValue={setInputValue}
      chatInputHeight={chatInputHeight}
      setChatInputHeight={setChatInputHeight}
      inputRef={inputRef}
      sendMessage={sendMessage}
      inputAccessoryViewID="chatInputAccessoryView"
      editable={showChatInputBehindKeyboard}
      onFocus={() => {
        if (Platform.OS === "ios") {
          inputAboveKeyboardRef.current?.focus();
          setShowChatInputBehindKeyboard(false);
        }
      }}
    />
  );

  // This one is a duplicate that is sticked above the keyboard on iOS
  const chatInputAboveKeyboard = (
    <ChatInput
      inputValue={inputValue}
      setInputValue={setInputValue}
      chatInputHeight={chatInputHeight}
      setChatInputHeight={setChatInputHeight}
      inputRef={inputAboveKeyboardRef}
      sendMessage={sendMessage}
    />
  );

  return (
    <View style={styles.chatContainer}>
      <View style={styles.chatContent}>
        {conversation && messagesArray.length > 0 && !isBlockedPeer && (
          <FlashList
            contentContainerStyle={styles.chat}
            data={messagesArray}
            renderItem={({ item }) => <ChatMessage message={item} />}
            onLayout={() => {
              if (!automaticallyAdjustKeyboardInsets) {
                setTimeout(() => {
                  setAutomaticallyAdjustKeyboardInsets(true);
                  onReadyToFocus();
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
            onScroll={(event) => {
              scrollPosition.current = event.nativeEvent.contentOffset.y;
            }}
          />
        )}
        {(messagesArray.length === 0 || isBlockedPeer || !conversation) && (
          <ChatPlaceholder
            onReadyToFocus={onReadyToFocus}
            inputAboveKeyboardRef={inputAboveKeyboardRef}
            isBlockedPeer={isBlockedPeer}
            conversation={conversation}
            messagesCount={messagesArray.length}
            sendMessage={sendMessage}
          />
        )}
      </View>

      {conversation && !isBlockedPeer && (
        <View
          style={{
            backgroundColor: tertiaryBackgroundColor(colorScheme),
            height: accessoryHeight,
          }}
        >
          {Platform.OS === "ios" && (
            <InputAccessoryView
              nativeID="chatInputAccessoryView"
              backgroundColor={tertiaryBackgroundColor(colorScheme)}
            >
              <View>{chatInputAboveKeyboard}</View>
            </InputAccessoryView>
          )}

          <View style={{ opacity: showChatInputBehindKeyboard ? 1 : 0 }}>
            {chatInputBehindKeyboard}
          </View>
        </View>
      )}
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    chatContainer: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
    chatContent: {
      flex: 1,
    },
    chat: {
      backgroundColor: backgroundColor(colorScheme),
    },
  });
