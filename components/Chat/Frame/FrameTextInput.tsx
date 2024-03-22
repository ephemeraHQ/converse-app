import { StyleSheet, TextInput } from "react-native";

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
}: {
  textInput: string | undefined;
  setFrameTextInputFocused: (f: boolean) => void;
  frameTextInputValue: string;
  setFrameTextInputValue: (s: string) => void;
}) {
  const styles = useStyles();
  return (
    <TextInput
      autoCorrect={false}
      autoComplete="off"
      autoCapitalize="none"
      style={styles.frameTextInput}
      onFocus={() => {
        setFrameTextInputFocused(true);
      }}
      onBlur={() => {
        setFrameTextInputFocused(false);
      }}
      onChangeText={setFrameTextInputValue}
      placeholder={textInput}
      placeholderTextColor={textSecondaryColor("light")}
      value={frameTextInputValue}
    />
  );
}

const useStyles = () => {
  return StyleSheet.create({
    frameTextInput: {
      backgroundColor: backgroundColor("light"),
      color: textPrimaryColor("light"),
      padding: 4,
      borderRadius: 4,
      width: "100%",
      marginVertical: 4,
      fontSize: 12,
      paddingVertical: 9,
      paddingHorizontal: 6,
    },
  });
};
