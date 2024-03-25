import { StyleSheet, TextInput, useColorScheme } from "react-native";

import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../../utils/colors";

export default function FrameTextInput({
  textInput,
  setFrameTextInputFocused,
  frameTextInputValue,
  setFrameTextInputValue,
  messageFromMe,
}: {
  textInput: string | undefined;
  setFrameTextInputFocused: (f: boolean) => void;
  frameTextInputValue: string;
  setFrameTextInputValue: (s: string) => void;
  messageFromMe: boolean;
}) {
  const styles = useStyles();
  const colorScheme = useColorScheme();
  const isDarkMessage = colorScheme === "dark" && !messageFromMe;
  return (
    <TextInput
      autoCorrect={false}
      autoComplete="off"
      autoCapitalize="none"
      style={[
        styles.frameTextInput,
        {
          backgroundColor: isDarkMessage
            ? "rgba(255,255,255,0.1)"
            : backgroundColor("light"),
          color: isDarkMessage
            ? textPrimaryColor("dark")
            : textPrimaryColor("light"),
        },
      ]}
      onFocus={() => {
        setFrameTextInputFocused(true);
      }}
      onBlur={() => {
        setFrameTextInputFocused(false);
      }}
      onChangeText={setFrameTextInputValue}
      placeholder={textInput}
      placeholderTextColor={
        isDarkMessage ? textSecondaryColor("dark") : textSecondaryColor("light")
      }
      value={frameTextInputValue}
    />
  );
}

const useStyles = () => {
  return StyleSheet.create({
    frameTextInput: {
      padding: 4,
      borderRadius: 2,
      width: "100%",
      marginVertical: 4,
      fontSize: 15,
      paddingVertical: 9,
      paddingHorizontal: 6,
    },
  });
};
