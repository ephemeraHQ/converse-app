import { Icon } from "@design-system/Icon/Icon";
import { IIconSizeKey } from "@theme/icon";
import { useAppTheme } from "@theme/useAppTheme";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  Pressable,
  PressableStateCallbackType,
  StyleProp,
  TextStyle,
  ViewStyle,
} from "react-native";

import { Haptics } from "../../utils/haptics";
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
    loading,
    withHapticFeedback = true,
    onPress,
    icon,
    // @deprecated,
    title,
    picto,
    ...rest
  } = props;

  const { themed, theme } = useAppTheme();

  const variant: IButtonVariant = props.variant ?? "fill";

  const $viewStyle = useMemo(
    () => [
      themed(
        getButtonViewStyle({ variant, size, action: "primary", pressed: false })
      ),
      $viewStyleOverride,
    ],
    [themed, variant, size, $viewStyleOverride]
  );

  const $pressedViewStyle = useMemo(
    () => [
      themed(
        getButtonViewStyle({ variant, size, action: "primary", pressed: true })
      ),
      $pressedViewStyleOverride,
    ],
    [themed, variant, size, $pressedViewStyleOverride]
  );

  const $disabledViewStyle = useMemo(
    () => [$disabledViewStyleOverride],
    [$disabledViewStyleOverride]
  );

  const $combinedTextStyle = useMemo(
    () => [
      themed(
        getButtonTextStyle({ variant, size, action: "primary", pressed: false })
      ),
      $textStyleOverride,
    ],
    [themed, variant, size, $textStyleOverride]
  );

  const $pressedTextStyle = useMemo(
    () => [
      themed(
        getButtonTextStyle({ variant, size, action: "primary", pressed: true })
      ),
      $pressedTextStyleOverride,
    ],
    [themed, variant, size, $pressedTextStyleOverride]
  );

  const $disabledTextStyle = useMemo(
    () => [$disabledTextStyleOverride],
    [$disabledTextStyleOverride]
  );

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      if (withHapticFeedback) {
        Haptics.softImpactAsync();
      }
      onPress?.(e);
    },
    [withHapticFeedback, onPress]
  );

  const _icon = icon ?? picto;

  const iconSize = useMemo((): IIconSizeKey => {
    if (size === "lg") {
      return "sm";
    }
    return "xs";
  }, [size]);

  return (
    <Pressable
      style={({ pressed }) => [
        pressed ? $pressedViewStyle : $viewStyle,
        disabled && $disabledViewStyle,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      onPress={handlePress}
      disabled={disabled}
      {...rest}
    >
      {(state) => {
        if (loading) {
          return <ActivityIndicator />;
        }

        return (
          <>
            {!!LeftAccessory && (
              <LeftAccessory
                style={$buttonLeftAccessoryStyle}
                pressableState={state}
                disabled={disabled}
              />
            )}

            {!!_icon && (
              <Icon
                icon={_icon}
                size={theme.iconSize[iconSize]}
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
              style={[
                state.pressed ? $pressedTextStyle : $combinedTextStyle,
                disabled && $disabledTextStyle,
              ]}
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
        );
      }}
    </Pressable>
  );
}
