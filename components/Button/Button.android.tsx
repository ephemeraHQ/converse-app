import React from "react";
import {
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  Text,
  ViewStyle,
} from "react-native";
import { Button as MaterialButton } from "react-native-paper";

import Picto from "../Picto/Picto.android";

type Props = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant: "primary" | "secondary" | "grey" | "text";
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
        icon={
          picto
            ? ({ color, size }) => (
                <Picto
                  picto={picto}
                  color={color}
                  size={size}
                  style={variant === "secondary" ? undefined : styles.picto}
                />
              )
            : undefined
        }
      >
        <Text style={textStyle}>{title}</Text>
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
});
