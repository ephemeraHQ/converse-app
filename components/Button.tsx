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

import { tableViewItemBackground } from "../utils/colors";
import Picto from "./Picto/Picto";

type Props = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant: "blue" | "grey" | "text";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  allowFontScaling?: boolean;
  picto?: string;
};

export default function Button({
  title,
  onPress,
  variant,
  style,
  textStyle,
  picto,
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
      {picto && (
        <Picto
          picto={picto}
          size={13}
          style={styles.picto}
          color="white"
          weight="bold"
        />
      )}
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
      flexDirection: "row",
      justifyContent: "center",
    },
    buttonBlueText: {
      color: "white",
      textAlign: "center",
      fontWeight: "600",
      fontSize: 17,
    },
    buttonGrey: {
      backgroundColor: tableViewItemBackground(colorScheme),
      paddingHorizontal: 15,
      paddingVertical: 4,
      borderRadius: 100,
    },
    buttonGreyText: {
      color: colorScheme === "light" ? PlatformColor("systemBlue") : "white",
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
    picto: {
      marginRight: 15,
    },
  });
