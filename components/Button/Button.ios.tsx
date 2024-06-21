import React from "react";
import {
  GestureResponderEvent,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  useColorScheme,
  ViewStyle,
} from "react-native";

import {
  dangerColor,
  primaryColor,
  backgroundColor,
  tertiaryBackgroundColor,
} from "../../utils/colors";
import Picto from "../Picto/Picto";

type Props = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant: "primary" | "secondary" | "secondary-danger" | "grey" | "text";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  allowFontScaling?: boolean;
  picto?: string;
  numberOfLines?: number;
};

export default function Button({
  title,
  onPress,
  variant,
  style,
  textStyle,
  picto,
  allowFontScaling = true,
  numberOfLines,
}: Props) {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const buttonStyle =
    variant === "primary"
      ? [styles.buttonPrimary]
      : variant === "secondary"
      ? [styles.buttonPrimary, styles.buttonSecondary]
      : variant === "grey"
      ? [styles.buttonGrey]
      : variant === "secondary-danger"
      ? [styles.buttonPrimary, styles.buttonSecondary, styles.buttonDanger]
      : [styles.buttonText];
  const buttonTextStyle =
    variant === "primary"
      ? [styles.buttonPrimaryText]
      : variant === "secondary" || variant === "secondary-danger"
      ? [styles.buttonPrimaryText, styles.buttonSecondaryText]
      : variant === "grey"
      ? [styles.buttonGreyText]
      : [styles.buttonTextText];
  return (
    <TouchableOpacity style={[...buttonStyle, style]} onPress={onPress}>
      {picto && (
        <Picto
          picto={picto}
          size={variant === "text" ? 15 : 13}
          style={[
            styles.picto,
            variant === "text" ? { paddingLeft: 15 } : undefined,
          ]}
          color={variant === "text" ? primaryColor(colorScheme) : "white"}
          weight={variant === "text" ? "medium" : "bold"}
        />
      )}
      <Text
        style={[...buttonTextStyle, textStyle]}
        allowFontScaling={allowFontScaling}
        numberOfLines={numberOfLines}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    buttonPrimary: {
      backgroundColor: primaryColor(colorScheme),
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
      color: backgroundColor(colorScheme),
      textAlign: "center",
      fontWeight: "600",
      fontSize: 17,
    },
    buttonSecondary: {
      paddingRight: 15,
      paddingLeft: 15,
      borderRadius: 100,
      paddingVertical: 7,
    },
    buttonDanger: {
      backgroundColor: dangerColor(colorScheme),
    },
    buttonSecondaryText: {
      fontWeight: "400",
    },
    buttonGrey: {
      backgroundColor: tertiaryBackgroundColor(colorScheme),
      paddingHorizontal: 15,
      paddingVertical: 4,
      borderRadius: 100,
    },
    buttonGreyText: {
      color: colorScheme === "light" ? primaryColor(colorScheme) : "white",
      textAlign: "center",
      fontWeight: "600",
      fontSize: 17,
    },
    buttonText: {
      flexDirection: "row",
    },
    buttonTextText: {
      color: Platform.OS === "ios" ? primaryColor(colorScheme) : "blue",
      textAlign: "center",
      fontWeight: "400",
      fontSize: 17,
    },
    picto: {
      marginRight: 15,
      marginLeft: 10,
    },
  });
};
