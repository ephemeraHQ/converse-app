import React from "react";
import {
  ColorSchemeName,
  GestureResponderEvent,
  Platform,
  PlatformColor,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  useColorScheme,
  ViewStyle,
} from "react-native";

import { primaryColor, tertiaryBackgroundColor } from "../../utils/colors";
import Picto from "../Picto/Picto";

type Props = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant: "primary" | "grey" | "text";
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
    variant === "primary"
      ? styles.buttonPrimary
      : variant === "grey"
      ? styles.buttonGrey
      : styles.buttonText;
  const buttonTextStyle =
    variant === "primary"
      ? styles.buttonPrimaryText
      : variant === "grey"
      ? styles.buttonGreyText
      : styles.buttonTextText;
  return (
    <TouchableOpacity style={[buttonStyle, style]} onPress={onPress}>
      {picto && (
        <Picto
          picto={picto}
          size={13}
          style={[
            styles.picto,
            variant === "text" ? { paddingLeft: 15 } : undefined,
          ]}
          color={variant === "text" ? primaryColor(colorScheme) : "white"}
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
    buttonPrimary: {
      backgroundColor:
        Platform.OS === "ios" ? PlatformColor("systemBlue") : "blue",
      display: "flex",
      alignSelf: "stretch",
      marginHorizontal: 32,
      textAlign: "center",
      paddingVertical: 14,
      borderRadius: 14,
      flexDirection: "row",
      justifyContent: "center",
    },
    buttonPrimaryText: {
      color: "white",
      textAlign: "center",
      fontWeight: "600",
      fontSize: 17,
    },
    buttonGrey: {
      backgroundColor: tertiaryBackgroundColor(colorScheme),
      paddingHorizontal: 15,
      paddingVertical: 4,
      borderRadius: 100,
    },
    buttonGreyText: {
      color:
        colorScheme === "light"
          ? Platform.OS === "ios"
            ? PlatformColor("systemBlue")
            : "blue"
          : "white",
      textAlign: "center",
      fontWeight: "600",
      fontSize: 17,
    },
    buttonText: {
      flexDirection: "row",
    },
    buttonTextText: {
      color: Platform.OS === "ios" ? PlatformColor("systemBlue") : "blue",
      textAlign: "center",
      fontWeight: "400",
      fontSize: 17,
    },
    picto: {
      marginRight: 15,
    },
  });
