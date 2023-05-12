import { MutableRefObject } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ColorSchemeName,
  useColorScheme,
  TouchableOpacity,
} from "react-native";

import SendButton from "../../assets/send-button.svg";
import {
  actionSecondaryColor,
  backgroundColor,
  itemSeparatorColor,
  tertiaryBackgroundColor,
} from "../../utils/colors";

type Props = {
  inputValue: string;
  setInputValue: (value: string) => void;
  chatInputHeight: number;
  setChatInputHeight: (height: number) => void;
  inputRef: MutableRefObject<TextInput | undefined>;
  sendMessage: (content: string) => Promise<void>;
  inputAccessoryViewID?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  editable?: boolean;
};

export default function ChatInput({
  inputValue,
  setInputValue,
  chatInputHeight,
  setChatInputHeight,
  inputRef,
  sendMessage,
  inputAccessoryViewID,
  onFocus,
  onBlur,
  editable,
}: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  return (
    <View style={styles.chatInputContainer}>
      <TextInput
        editable={editable !== undefined ? editable : true}
        style={[
          styles.chatInput,
          {
            height: chatInputHeight,
            maxHeight: 124,
          },
        ]}
        value={inputValue}
        onChangeText={setInputValue}
        onContentSizeChange={(event) => {
          setChatInputHeight(
            Math.min(
              124,
              Math.max(36, event.nativeEvent.contentSize.height + 12)
            )
          );
        }}
        onLayout={(event) => {
          setChatInputHeight(
            Math.min(124, Math.max(36, event.nativeEvent.layout.height))
          );
        }}
        multiline
        ref={(r) => {
          if (r) {
            inputRef.current = r;
          }
        }}
        placeholder="Message"
        placeholderTextColor={actionSecondaryColor(colorScheme)}
        inputAccessoryViewID={inputAccessoryViewID}
        onFocus={onFocus ? () => onFocus() : undefined}
        onBlur={onBlur ? () => onBlur() : undefined}
      />
      <TouchableOpacity
        onPress={() => sendMessage(inputValue)}
        style={styles.sendButtonContainer}
      >
        <SendButton
          width={36}
          height={36}
          style={[
            styles.sendButton,
            { opacity: inputValue.length > 0 ? 1 : 0.6 },
          ]}
        />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    chatInputContainer: {
      backgroundColor: tertiaryBackgroundColor(colorScheme),
      flexDirection: "row",
    },
    chatInput: {
      backgroundColor: backgroundColor(colorScheme),
      flexGrow: 1,
      flexShrink: 1,
      marginLeft: 12,
      marginVertical: 6,
      paddingTop: 7,
      paddingBottom: 7,
      paddingLeft: 12,
      fontSize: 17,
      lineHeight: 22,
      borderRadius: 18,
      borderWidth: 0.5,
      borderColor: itemSeparatorColor(colorScheme),
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
