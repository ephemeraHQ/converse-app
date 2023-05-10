import { MutableRefObject } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  ColorSchemeName,
  useColorScheme,
} from "react-native";

type Props = {
  inputValue: string;
  setInputValue: (value: string) => void;
  chatInputHeight: number;
  setChatInputHeight: (height: number) => void;
  inputRef: MutableRefObject<TextInput | undefined>;
};

export default function ChatInput({
  inputValue,
  setInputValue,
  chatInputHeight,
  setChatInputHeight,
  inputRef,
}: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  return (
    <View style={styles.chatInputContainer}>
      <TextInput
        style={[styles.chatInput, { height: chatInputHeight }]}
        value={inputValue}
        onChangeText={setInputValue}
        onContentSizeChange={(event) => {
          setChatInputHeight(
            Math.max(25, event.nativeEvent.contentSize.height)
          );
        }}
        multiline
        ref={(r) => {
          if (r) {
            inputRef.current = r;
          }
        }}
      />
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    chatInputContainer: {
      backgroundColor: "cyan",
    },
    chatInput: {
      backgroundColor: "orange",
    },
  });
