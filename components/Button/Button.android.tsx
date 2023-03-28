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
  return (
    <View
      style={[
        variant === "primary" ? styles.buttonPrimaryContainer : undefined,
        style,
      ]}
    >
      <MaterialButton
        mode={variant === "primary" ? "contained" : "text"}
        style={variant === "primary" ? styles.buttonPrimary : undefined}
        onPress={onPress}
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
  buttonPrimary: {
    width: "100%",
  },
});
