import React from "react";
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { Button as MaterialButton } from "react-native-paper";

import Picto from "../Picto/Picto";

type Props = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant: "primary" | "secondary" | "grey" | "text" | "secondary-danger";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  allowFontScaling?: boolean;
  picto?: string;
  disabled?: boolean;
};

export default function Button({
  title,
  onPress,
  variant,
  style,
  textStyle,
  picto,
  allowFontScaling = true,
  disabled = false,
}: Props) {
  return (
    <View
      style={[
        variant === "primary"
          ? styles.buttonPrimaryContainer
          : variant === "secondary"
          ? styles.buttonSecondaryContainer
          : undefined,
        style,
      ]}
    >
      <MaterialButton
        disabled={disabled}
        mode={
          variant === "primary" || variant === "secondary"
            ? "contained"
            : "text"
        }
        style={
          variant === "primary" || variant === "secondary"
            ? styles.buttonPrimary
            : undefined
        }
        onPress={onPress}
        labelStyle={textStyle}
        icon={
          picto
            ? ({ color, size }) => (
                <Picto
                  picto={picto}
                  color={color}
                  size={size}
                  style={
                    variant === "secondary" || variant === "text"
                      ? undefined
                      : styles.picto
                  }
                />
              )
            : undefined
        }
      >
        <Text style={styles.textContainer}>{title}</Text>
      </MaterialButton>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonPrimaryContainer: {
    paddingHorizontal: 32,
    width: "100%",
  },
  buttonSecondaryContainer: {
    paddingHorizontal: 16,
    width: "auto",
  },
  buttonPrimary: {
    width: "100%",
  },
  picto: {
    marginRight: 10,
  },
  textContainer: {
    flexGrow: 1,
  },
});
