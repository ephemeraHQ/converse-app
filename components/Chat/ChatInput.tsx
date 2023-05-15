import { MutableRefObject } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ColorSchemeName,
  useColorScheme,
  TouchableOpacity,
  Platform,
} from "react-native";
import Reanimated, {
  SharedValue,
  withTiming,
  useAnimatedStyle,
} from "react-native-reanimated";

import SendButton from "../../assets/send-button.svg";
import {
  actionSecondaryColor,
  backgroundColor,
  itemSeparatorColor,
  tertiaryBackgroundColor,
  textSecondaryColor,
} from "../../utils/colors";

type Props = {
  inputValue: string;
  setInputValue: (value: string) => void;
  chatInputHeight: SharedValue<number>;
  inputRef: MutableRefObject<TextInput | undefined>;
  sendMessage: (content: string) => Promise<void>;
  inputAccessoryViewID?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  editable?: boolean;
};

const AnimatedTextInput = Reanimated.createAnimatedComponent(TextInput);

export default function ChatInput({
  inputValue,
  setInputValue,
  chatInputHeight,
  inputRef,
  sendMessage,
  inputAccessoryViewID,
  onFocus,
  onBlur,
  editable,
}: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const textInputStyle = useAnimatedStyle(
    () => ({
      ...styles.chatInput,
      maxHeight: 124,
      height: chatInputHeight.value,
    }),
    []
  );
  return (
    <View style={styles.chatInputContainer}>
      <AnimatedTextInput
        editable={editable !== undefined ? editable : true}
        style={textInputStyle}
        value={inputValue}
        onChangeText={setInputValue}
        onContentSizeChange={(event) => {
          const marginToAdd = Platform.OS === "ios" ? 12 : 0;
          let newInputHeight = Math.min(
            124,
            Math.max(36, event.nativeEvent.contentSize.height + marginToAdd)
          );
          console.log({ calculated: newInputHeight });
          if (newInputHeight > 102) {
            newInputHeight = 124;
          } else if (newInputHeight > 80) {
            newInputHeight = 102;
          } else if (newInputHeight > 70) {
            newInputHeight = 80;
          } else if (newInputHeight > 58) {
            newInputHeight = 70;
          } else if (newInputHeight > 36) {
            newInputHeight = 58;
          } else {
            newInputHeight = 36;
          }

          console.log({ newInputHeight });
          chatInputHeight.value =
            Platform.OS === "android"
              ? newInputHeight
              : withTiming(newInputHeight, { duration: 200 });
        }}
        multiline
        ref={(r) => {
          if (r) {
            inputRef.current = r as TextInput;
          }
        }}
        placeholder="Message"
        placeholderTextColor={
          Platform.OS === "android"
            ? textSecondaryColor(colorScheme)
            : actionSecondaryColor(colorScheme)
        }
        inputAccessoryViewID={inputAccessoryViewID}
        onFocus={onFocus ? () => onFocus() : undefined}
        onBlur={onBlur ? () => onBlur() : undefined}
      />
      <TouchableOpacity
        onPress={
          inputValue.length > 0 ? () => sendMessage(inputValue) : undefined
        }
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
          ? tertiaryBackgroundColor(colorScheme)
          : backgroundColor(colorScheme),
      flexGrow: 1,
      flexShrink: 1,
      marginLeft: 12,
      marginVertical: 6,
      paddingTop: 7,
      paddingBottom: 7,
      paddingLeft: 12,
      fontSize: Platform.OS === "android" ? 16 : 17,
      lineHeight: 22,
      borderRadius: 18,
      borderWidth: Platform.OS === "android" ? 0 : 0.5,
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
