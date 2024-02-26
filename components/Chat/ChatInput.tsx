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
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { useConversationContext } from "../../utils/conversation";
import { isDesktop } from "../../utils/device";
import { converseEventEmitter } from "../../utils/events";
import { sendMessage } from "../../utils/message";
import { TextInputWithValue } from "../../utils/str";
import ChatAddAttachment from "./ChatAddAttachment";
import ChatInputReplyPreview from "./ChatInputReplyPreview";
import { MessageToDisplay } from "./ChatMessage";
import ChatSendMoney from "./ChatSendMoney";

export default function ChatInput() {
  const { conversation, inputRef, transactionMode, messageToPrefill } =
    useConversationContext([
      "conversation",
      "inputRef",
      "messageToPrefill",
      "transactionMode",
    ]);

  const colorScheme = useColorScheme();
  const styles = useStyles();
  const [inputValue, setInputValue] = useState(messageToPrefill);
  const [replyingToMessage, setReplyingToMessage] =
    useState<MessageToDisplay | null>(null);

  useEffect(() => {
    if (transactionMode) {
      setInputValue("");
    }
  }, [transactionMode]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.currentValue = inputValue;
    }
  }, [inputRef, inputValue]);

  useEffect(() => {
    converseEventEmitter.on(
      "triggerReplyToMessage",
      (message: MessageToDisplay) => {
        if (inputRef.current) {
          inputRef.current?.focus();
        }
        setReplyingToMessage(message);
      }
    );
    return () => {
      converseEventEmitter.off("triggerReplyToMessage");
    };
  }, [inputRef]);

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
      if (replyingToMessage) {
        sendMessage({
          conversation,
          content: inputValue,
          referencedMessageId: replyingToMessage.id,
          contentType: "xmtp.org/text:1.0",
        });
        setReplyingToMessage(null);
      } else {
        sendMessage({
          conversation,
          content: inputValue,
          contentType: "xmtp.org/text:1.0",
        });
      }
      setInputValue("");
    }
  }, [conversation, inputValue, replyingToMessage]);

  const inputIsFocused = useRef(false);

  return (
    <View style={styles.chatInputWrapper}>
      {replyingToMessage && (
        <View style={styles.replyToMessagePreview}>
          <ChatInputReplyPreview
            replyingToMessage={replyingToMessage}
            onDismiss={() => setReplyingToMessage(null)}
          />
        </View>
      )}
      <View style={styles.chatInputContainer}>
        <ChatAddAttachment />
        <ChatSendMoney />
        <TextInput
          autoCorrect={isDesktop ? false : undefined}
          autoComplete={isDesktop ? "off" : undefined}
          style={styles.chatInput}
          value={inputValue}
          // On desktop, we modified React Native RCTUITextView.m
          // to handle key Shift + Enter to add new line
          // This disables the flickering on Desktop when hitting Enter
          blurOnSubmit={isDesktop}
          // Mainly used on Desktop so that Enter sends the message
          onSubmitEditing={() => {
            onValidate();
            // But we still want to refocus on Desktop when we
            // hit Enter so let's force it
            if (isDesktop) {
              setTimeout(() => {
                inputRef.current?.focus();
              }, 100);
            }
          }}
          onChangeText={(t: string) => {
            inputIsFocused.current = true;
            setInputValue(t);
          }}
          onKeyPress={
            Platform.OS === "web"
              ? (event: any) => {
                  if (
                    event.nativeEvent.key === "Enter" &&
                    !event.altKey &&
                    !event.metaKey &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();
                    onValidate();
                    setTimeout(() => {
                      inputRef.current?.focus();
                    }, 100);
                  }
                }
              : undefined
          }
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
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    chatInputWrapper: {
      flexDirection: "column",
      backgroundColor: backgroundColor(colorScheme),
    },
    replyToMessagePreview: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: itemSeparatorColor(colorScheme),
    },
    chatInputContainer: {
      backgroundColor: backgroundColor(colorScheme),
      flexDirection: "row",
      paddingBottom: 8,
    },
    chatInput: {
      backgroundColor:
        Platform.OS === "android"
          ? chatInputBackgroundColor(colorScheme)
          : backgroundColor(colorScheme),
      maxHeight: Platform.OS === "web" ? 37 : 130,
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
