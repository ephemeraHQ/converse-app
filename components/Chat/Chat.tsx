import { FlashList } from "@shopify/flash-list";
import { MutableRefObject, useContext, useRef, useState } from "react";
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
import { XmtpConversation } from "../../data/store/xmtpReducer";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";

type Props = {
  conversation: XmtpConversation | undefined;
  xmtpAddress?: string;
  setInputValue: (value: string) => void;
  inputValue: string;
  inputRef: MutableRefObject<TextInput | undefined>;
};

export default function Chat({
  conversation,
  xmtpAddress,
  setInputValue,
  inputValue,
  inputRef,
}: Props) {
  const { state } = useContext(AppContext);
  const colorScheme = useColorScheme();
  const [
    automaticallyAdjustKeyboardInsets,
    setAutomaticallyAdjustKeyboardInsets,
  ] = useState(false);
  const [chatInputHeight, setChatInputHeight] = useState(25);

  const styles = getStyles(colorScheme);
  const messagesArray = Array.from(
    conversation ? conversation.messages.values() : []
  ).reverse();
  const insets = useSafeAreaInsets();
  const minAccessoryHeight = useRef(chatInputHeight + insets.bottom);
  const chatInput = (
    <ChatInput
      inputValue={inputValue}
      setInputValue={setInputValue}
      chatInputHeight={chatInputHeight}
      setChatInputHeight={setChatInputHeight}
      inputRef={inputRef}
    />
  );
  return (
    <View style={styles.chatContainer}>
      <FlashList
        contentContainerStyle={styles.chat}
        data={messagesArray}
        renderItem={({ item }) => (
          <ChatMessage xmtpAddress={xmtpAddress} message={item} />
        )}
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
