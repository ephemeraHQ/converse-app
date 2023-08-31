import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Platform,
} from "react-native";

import SendButton from "../../assets/send-button.svg";
import {
  actionSecondaryColor,
  backgroundColor,
  chatInputBackgroundColor,
  itemSeparatorColor,
  tertiaryBackgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { useConversationContext } from "../../utils/conversation";
import { converseEventEmitter } from "../../utils/events";
import { sendMessage } from "../../utils/message";
import { TextInputWithValue } from "../../utils/str";
import ChatAddAttachment from "./ChatAddAttachment";

const {
  ModifiersType,
  ReactNativeKeysKeyCode,
  useHotkey,
} = require("react-native-hotkeys");

export default function ChatInput() {
  const { conversation, inputRef, messageToPrefill } = useConversationContext([
    "conversation",
    "inputRef",
    "messageToPrefill",
  ]);

  const colorScheme = useColorScheme();
  const styles = useStyles();
  const [inputValue, setInputValue] = useState(messageToPrefill);

  // We use an event emitter to receive actions to fill the input value
  // from outside. This enable us to keep a very small re-rendering
  // by creating the inputValue in the lowest component, this one

  useEffect(() => {
    converseEventEmitter.on("setCurrentConversationInputValue", setInputValue);
    return () => {
      converseEventEmitter.off(
        "setCurrentConversationInputValue",
        setInputValue
      );
    };
  }, []);

  const onValidate = useCallback(() => {
    if (conversation && inputValue.length > 0) {
      sendMessage(conversation, inputValue);
      setInputValue("");
      if (inputRef.current) {
        inputRef.current.currentValue = "";
      }
    }
  }, [conversation, inputRef, inputValue]);

  // We use react-native-hotkeys to get events from the Mac Keyboard
  // in order to send when doing Command + Enter

  const inputIsFocused = useRef(false);
  useHotkey(
    ReactNativeKeysKeyCode.Enter,
    () => {
      if (inputIsFocused.current) {
        onValidate();
      }
    },
    { modifiers: ModifiersType.Hyper }
  );

  return (
    <View style={styles.chatInputContainer}>
      <ChatAddAttachment />
      <TextInput
        style={styles.chatInput}
        value={inputValue}
        onChangeText={(t: string) => {
          inputIsFocused.current = true;
          setInputValue(t);
          if (inputRef.current) {
            inputRef.current.currentValue = t;
          }
        }}
        onFocus={() => {
          inputIsFocused.current = true;
        }}
        onBlur={() => {
          inputIsFocused.current = false;
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
        onPress={onValidate}
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

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
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
};
