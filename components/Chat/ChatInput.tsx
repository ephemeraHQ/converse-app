import { useEffect, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ColorSchemeName,
  useColorScheme,
  TouchableOpacity,
  Platform,
} from "react-native";

import SendButton from "../../assets/send-button.svg";
import { useConversationContext } from "../../screens/Conversation";
import {
  actionSecondaryColor,
  backgroundColor,
  chatInputBackgroundColor,
  itemSeparatorColor,
  tertiaryBackgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { eventEmitter } from "../../utils/events";
import { sendMessage } from "../../utils/message";
import { TextInputWithValue } from "../../utils/str";
import ChatAddAttachment from "./ChatAddAttachment";

export default function ChatInput() {
  const { conversation, inputRef, messageToPrefill } = useConversationContext([
    "conversation",
    "inputRef",
    "messageToPrefill",
  ]);

  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const [inputValue, setInputValue] = useState(messageToPrefill);

  // We use an event emitter to receive actions to fill the input value
  // from outside. This enable us to keep a very small re-rendering
  // by creating the inputValue in the lowest component, this one

  useEffect(() => {
    eventEmitter.on("setCurrentConversationInputValue", setInputValue);
    return () => {
      eventEmitter.off("setCurrentConversationInputValue", setInputValue);
    };
  }, []);

  return (
    <View style={styles.chatInputContainer}>
      <ChatAddAttachment />
      <TextInput
        style={styles.chatInput}
        value={inputValue}
        onChangeText={(t: string) => {
          setInputValue(t);
          if (inputRef.current) {
            inputRef.current.currentValue = t;
          }
        }}
        multiline
        ref={(r) => {
          if (r && !inputRef.current) {
            inputRef.current = r as TextInputWithValue;
            inputRef.current.currentValue = messageToPrefill;
          }
        }}
        placeholder="Message"
        placeholderTextColor={
          Platform.OS === "android"
            ? textSecondaryColor(colorScheme)
            : actionSecondaryColor(colorScheme)
        }
      />
      <TouchableOpacity
        onPress={() => {
          if (conversation && inputValue.length > 0) {
            sendMessage(conversation, inputValue);
            setInputValue("");
            if (inputRef.current) {
              inputRef.current.currentValue = "";
            }
          }
        }}
        activeOpacity={inputValue.length > 0 ? 0.4 : 0.6}
        style={[
          styles.sendButtonContainer,
          { opacity: inputValue.length > 0 ? 1 : 0.6 },
        ]}
      >
        <SendButton width={36} height={36} style={[styles.sendButton]} />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    chatInputContainer: {
      backgroundColor:
        Platform.OS === "android"
          ? backgroundColor(colorScheme)
          : tertiaryBackgroundColor(colorScheme),
      flexDirection: "row",
    },
    chatInput: {
      backgroundColor:
        Platform.OS === "android"
          ? chatInputBackgroundColor(colorScheme)
          : backgroundColor(colorScheme),
      maxHeight: 130,
      flexGrow: 1,
      flexShrink: 1,
      marginLeft: 12,
      marginVertical: 6,
      paddingTop: Platform.OS === "android" ? 4 : 7,
      paddingBottom: Platform.OS === "android" ? 4 : 7,
      paddingLeft: 12,
      paddingRight: 12,
      fontSize: Platform.OS === "android" ? 16 : 17,
      lineHeight: 22,
      borderRadius: 18,
      borderWidth: Platform.OS === "android" ? 0 : 0.5,
      borderColor: itemSeparatorColor(colorScheme),
      color: textPrimaryColor(colorScheme),
    },
    sendButtonContainer: {
      width: 60,
      alignItems: "center",
    },
    sendButton: {
      marginTop: "auto",
      marginBottom: 6,
    },
  });
