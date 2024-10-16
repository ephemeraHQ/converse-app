import React, { useCallback } from "react";
import {
  GestureResponderEvent,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";
import { Button as RNPButton } from "react-native-paper";

import Picto from "../../components/Picto/Picto";

export type IButtonVariant =
  | "primary"
  | "secondary"
  | "secondary-danger"
  | "grey"
  | "text";

export type IButtonProps = {
  title: string;
  variant?: IButtonVariant;
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  picto?: string;
  hitSlop?: number;
};

export default function Button({
  title,
  onPress,
  variant = "primary",
  textStyle,
  picto,
  hitSlop,
  ...rest
}: IButtonProps) {
  const renderIcon = useCallback(
    ({ color, size }: { color: string; size: number }) => {
      if (!picto) {
        return null;
      }
      return <Picto picto={picto} color={color} size={size} />;
    },
    [picto]
  );

  return (
    <RNPButton
      mode={
        variant === "primary" || variant === "secondary" ? "contained" : "text"
      }
      onPress={onPress}
      labelStyle={textStyle}
      icon={renderIcon}
      hitSlop={hitSlop}
      {...rest}
    >
      {title}
    </RNPButton>
  );
}
