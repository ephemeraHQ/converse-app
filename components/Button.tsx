import React from "react";
import {
  ColorSchemeName,
  GestureResponderEvent,
  PlatformColor,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  useColorScheme,
  ViewStyle,
} from "react-native";

import { buttonGreyBackground } from "../utils/colors";

type Props = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant: "blue" | "grey" | "text";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  allowFontScaling?: boolean;
};

export default function Button({
  title,
  onPress,
  variant,
  style,
  textStyle,
  allowFontScaling = true,
}: Props) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const buttonStyle =
    variant === "blue"
      ? styles.buttonBlue
      : variant === "grey"
      ? styles.buttonGrey
      : styles.buttonText;
  const buttonTextStyle =
    variant === "blue"
      ? styles.buttonBlueText
      : variant === "grey"
      ? styles.buttonGreyText
      : styles.buttonTextText;
  return (
    <TouchableOpacity style={[buttonStyle, style]} onPress={onPress}>
      <Text
        style={[buttonTextStyle, textStyle]}
        allowFontScaling={allowFontScaling}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    buttonBlue: {
      backgroundColor: PlatformColor("systemBlue"),
      display: "flex",
      alignSelf: "stretch",
      marginHorizontal: 32,
      textAlign: "center",
      paddingVertical: 14,
      borderRadius: 14,
    },
    buttonBlueText: {
      color: "white",
      textAlign: "center",
      fontWeight: "600",
      fontSize: 17,
    },
    buttonGrey: {
      backgroundColor: buttonGreyBackground(colorScheme),
      paddingHorizontal: 15,
      paddingVertical: 4,
      borderRadius: 100,
    },
    buttonGreyText: {
      color: PlatformColor("systemBlue"),
      textAlign: "center",
      fontWeight: "600",
      fontSize: 17,
    },
    buttonText: {},
    buttonTextText: {
      color: PlatformColor("systemBlue"),
      textAlign: "center",
      fontWeight: "400",
      fontSize: 17,
    },
  });
