import { useAppTheme } from "@theme/useAppTheme";
import { useCallback } from "react";
import {
  Pressable,
  PressableStateCallbackType,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";

import Picto from "../../components/Picto/Picto";
import { Text } from "../Text";
import { IButtonProps, IButtonVariant } from "./Button.props";
import {
  $buttonLeftAccessoryStyle,
  $buttonRightAccessoryStyle,
  getButtonTextStyle,
  getButtonViewStyle,
} from "./Button.styles";

export function Button(props: IButtonProps) {
  const {
    tx,
    text,
    txOptions,
    style: $viewStyleOverride,
    pressedStyle: $pressedViewStyleOverride,
    textStyle: $textStyleOverride,
    pressedTextStyle: $pressedTextStyleOverride,
    disabledTextStyle: $disabledTextStyleOverride,
    children,
    RightAccessory,
    LeftAccessory,
    disabled,
    disabledStyle: $disabledViewStyleOverride,
    size = "lg",
    // @deprecated,
    title,
    picto,
    ...rest
  } = props;

  const { themed, theme } = useAppTheme();

  const variant: IButtonVariant = props.variant ?? "fill";

  const $viewStyle = useCallback(
    ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> => {
      return [
        themed(
          getButtonViewStyle({ variant, size, action: "primary", pressed })
        ),
        $viewStyleOverride,
        pressed && $pressedViewStyleOverride,
        disabled && $disabledViewStyleOverride,
      ];
    },
    [
      themed,
      variant,
      size,
      $viewStyleOverride,
      $pressedViewStyleOverride,
      $disabledViewStyleOverride,
      disabled,
    ]
  );

  const $textStyle = useCallback(
    ({ pressed }: PressableStateCallbackType): StyleProp<TextStyle> => {
      return [
        themed(
          getButtonTextStyle({ variant, size, action: "primary", pressed })
        ),
        $textStyleOverride,
        pressed && $pressedTextStyleOverride,
        disabled && $disabledTextStyleOverride,
      ];
    },
    [
      themed,
      variant,
      size,
      $textStyleOverride,
      $pressedTextStyleOverride,
      $disabledTextStyleOverride,
      disabled,
    ]
  );

  return (
    <Pressable
      style={$viewStyle}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      {...rest}
      disabled={disabled}
    >
      {(state) => (
        <>
          {!!LeftAccessory && (
            <LeftAccessory
              style={$buttonLeftAccessoryStyle}
              pressableState={state}
              disabled={disabled}
            />
          )}

          {/* @deprecated stuff */}
          {!!picto && (
            <Picto
              picto={picto}
              color={
                variant === "text" || variant === "link"
                  ? theme.colors.text.primary
                  : theme.colors.text.inverted.primary
              }
              style={themed($buttonLeftAccessoryStyle)}
            />
          )}

          <Text
            tx={tx}
            text={title ?? text}
            txOptions={txOptions}
            style={$textStyle(state)}
          >
            {children}
          </Text>

          {!!RightAccessory && (
            <RightAccessory
              style={$buttonRightAccessoryStyle}
              pressableState={state}
              disabled={disabled}
            />
          )}
        </>
      )}
    </Pressable>
  );
}
