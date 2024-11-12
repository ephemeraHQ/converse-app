import React, {
  forwardRef,
  Ref,
  useCallback,
  useImperativeHandle,
  useRef,
} from "react";
import { TextInput, TextStyle, ViewStyle } from "react-native";

import { translate } from "@i18n";
import { $globalStyles } from "@theme/styles";
import { ThemedStyle, ThemedStyleArray, useAppTheme } from "@theme/useAppTheme";
import { HStack } from "../HStack";
import { Text } from "../Text/Text";
import { textPresets } from "../Text/Text.presets";
import { TouchableOpacity } from "../TouchableOpacity";
import { VStack } from "../VStack";
import { TextFieldProps } from "./TextField.props";

export const TextField = forwardRef(function TextField(
  props: TextFieldProps,
  ref: Ref<TextInput>
) {
  const {
    labelTx,
    label,
    labelTxOptions,
    placeholderTx,
    placeholder,
    placeholderTxOptions,
    helper,
    helperTx,
    helperTxOptions,
    status,
    RightAccessory,
    LeftAccessory,
    HelperTextProps,
    LabelTextProps,
    style: $inputStyleOverride,
    containerStyle: $containerStyleOverride,
    inputWrapperStyle: $inputWrapperStyleOverride,
    ...TextInputProps
  } = props;
  const input = useRef<TextInput>(null);

  const { themed, theme } = useAppTheme();

  const disabled = TextInputProps.editable === false || status === "disabled";

  const placeholderContent = placeholderTx
    ? translate(placeholderTx, placeholderTxOptions)
    : placeholder;

  const $containerStyles = [$containerStyle, $containerStyleOverride];

  const $labelStyles = [
    $labelStyle,
    disabled && { color: theme.colors.text.tertiary },
    LabelTextProps?.style,
  ];

  const $inputWrapperStyles = [
    $inputWrapperStyle,
    status === "error" && { borderColor: theme.colors.global.caution },
    TextInputProps.multiline && { minHeight: 112 },
    LeftAccessory && { paddingStart: 0 },
    RightAccessory && { paddingEnd: 0 },
    $inputWrapperStyleOverride,
  ];

  const $inputStyles: ThemedStyleArray<TextStyle> = [
    $inputStyle,
    disabled && { color: theme.colors.text.tertiary },
    TextInputProps.multiline && { height: "auto" },
    $inputStyleOverride,
    themed(textPresets["body"]),
  ];

  const $helperStyles = [
    $helperStyle,
    status === "error" && { color: theme.colors.global.caution },
    HelperTextProps?.style,
  ];

  const $labelAndInputContainerStyles = [
    $globalStyles.flex1,
    !(label || labelTx) && $globalStyles.justifyCenter,
  ];

  const onFocus = useCallback(() => {
    if (disabled) return;
    input.current?.focus();
  }, [disabled]);

  useImperativeHandle(ref, () => input.current as TextInput);

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={themed($containerStyles)}
      onPress={onFocus}
      accessibilityState={{ disabled }}
    >
      <HStack style={themed($inputWrapperStyles)}>
        {!!LeftAccessory && (
          <LeftAccessory
            style={themed([
              $leftAccessoryStyle,
              TextInputProps.multiline && { alignItems: "flex-start" },
            ])}
            status={status}
            editable={!disabled}
            multiline={TextInputProps.multiline ?? false}
          />
        )}

        <VStack style={themed($labelAndInputContainerStyles)}>
          {!!(label || labelTx) && (
            <Text
              preset="formLabel"
              text={label}
              tx={labelTx}
              txOptions={labelTxOptions}
              numberOfLines={1}
              {...LabelTextProps}
              style={themed($labelStyles)}
            />
          )}

          <TextInput
            ref={input}
            underlineColorAndroid={theme.colors.global.transparent}
            textAlignVertical="top"
            placeholder={placeholderContent}
            placeholderTextColor={theme.colors.text.tertiary}
            {...TextInputProps}
            editable={!disabled}
            style={themed($inputStyles)}
          />
        </VStack>

        {!!RightAccessory && (
          <RightAccessory
            style={themed($rightAccessoryStyle)}
            status={status}
            editable={!disabled}
            multiline={TextInputProps.multiline ?? false}
          />
        )}
      </HStack>

      {!!(helper || helperTx) && (
        <Text
          preset="formHelper"
          text={helper}
          tx={helperTx}
          txOptions={helperTxOptions}
          {...HelperTextProps}
          style={themed($helperStyles)}
        />
      )}
    </TouchableOpacity>
  );
});

const $containerStyle: ThemedStyle<ViewStyle> = ({
  spacing,
  borderRadius,
}) => ({
  //   ...debugBorder(),
});

const $labelStyle: ThemedStyle<TextStyle> = ({ spacing }) => ({});

const $inputWrapperStyle: ThemedStyle<ViewStyle> = ({
  colors,
  borderRadius,
  borderWidth,
  spacing,
}) => ({
  borderWidth: borderWidth.sm,
  borderRadius: borderRadius.xs,
  backgroundColor: colors.background.surface,
  borderColor: colors.border.subtle,
  overflow: "hidden",
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
});

const $inputStyle: ThemedStyle<TextStyle> = ({ colors }) => ({});

const $helperStyle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.xxxs,
  paddingHorizontal: spacing.xs,
});

const $rightAccessoryStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginEnd: spacing.xxs,
  flexShrink: 0,
  justifyContent: "center",
  alignItems: "center",
});

const $leftAccessoryStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginStart: spacing.xxs,
  marginEnd: spacing.xxs,
  flexShrink: 0,
  justifyContent: "center",
  alignItems: "center",
});
