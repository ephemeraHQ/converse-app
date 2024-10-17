import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button as MaterialButton } from "react-native-paper";

import { IButtonProps } from "./Button.props";
import Picto from "../Picto/Picto";

export default function Button({
  title,
  onPress,
  variant,
  style,
  textStyle,
  picto,
  allowFontScaling = true,
  loading,
}: IButtonProps) {
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
        loading={loading}
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
