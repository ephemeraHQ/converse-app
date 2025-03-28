import { translate } from "@i18n"
import { $globalStyles } from "@theme/styles"
import React, { forwardRef, Ref, useCallback, useImperativeHandle, useRef } from "react"
import { TextInput as RNTextInput, TextStyle, ViewStyle } from "react-native"
import { TextInput } from "@/design-system/text-input"
import { ThemedStyle, ThemedStyleArray, useAppTheme } from "@/theme/use-app-theme"
import { HStack } from "../HStack"
import { Text } from "../Text/Text"
import { TouchableOpacity } from "../TouchableOpacity"
import { VStack } from "../VStack"
import { TextFieldProps } from "./TextField.props"

export const TextField = forwardRef(function TextField(
  props: TextFieldProps,
  ref: Ref<RNTextInput>,
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
  } = props
  const input = useRef<RNTextInput>(null)

  const { themed, theme } = useAppTheme()

  const disabled = TextInputProps.editable === false || status === "disabled"

  const placeholderContent = placeholderTx
    ? translate(placeholderTx, placeholderTxOptions)
    : placeholder

  const $containerStyles = [$containerStyle, $containerStyleOverride]

  const $labelStyles = [
    $labelStyle,
    disabled && { color: theme.colors.text.tertiary },
    LabelTextProps?.style,
  ]

  const $inputWrapperStyles = [
    $inputWrapperStyle,
    status === "error" && { borderColor: theme.colors.global.caution },
    TextInputProps.multiline && { minHeight: 112 },
    LeftAccessory && { paddingStart: 0 },
    RightAccessory && { paddingEnd: 0 },
    $inputWrapperStyleOverride,
  ]

  const $inputStyles: ThemedStyleArray<TextStyle> = [
    disabled && { color: theme.colors.text.tertiary },
    TextInputProps.multiline && { height: "auto" },
    $inputStyleOverride,
  ]

  const $helperContainerStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
    marginTop: spacing.xxxs,
    paddingHorizontal: spacing.xs,
  })

  const $helperStyles = [
    $helperStyle,
    status === "error" && { color: theme.colors.global.caution },
    HelperTextProps?.style,
  ]

  const $labelAndInputContainerStyles = [
    $globalStyles.flex1,
    !(label || labelTx) && $globalStyles.justifyCenter,
  ]

  const onFocus = useCallback(() => {
    if (disabled) return
    input.current?.focus()
  }, [disabled])

  useImperativeHandle(ref, () => input.current as RNTextInput)

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
        <VStack style={themed($helperContainerStyle)}>
          {typeof helper === "string" ? (
            <Text
              preset="formHelper"
              text={helper}
              tx={helperTx}
              txOptions={helperTxOptions}
              {...HelperTextProps}
              style={themed($helperStyles)}
            />
          ) : (
            helper
          )}
        </VStack>
      )}
    </TouchableOpacity>
  )
})

const $containerStyle: ThemedStyle<ViewStyle> = ({ spacing, borderRadius }) => ({
  //   ...debugBorder(),
})

const $labelStyle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing["4xs"],
})

const $inputWrapperStyle: ThemedStyle<ViewStyle> = ({
  colors,
  borderRadius,
  borderWidth,
  spacing,
}) => ({
  borderWidth: borderWidth.sm,
  borderRadius: borderRadius.xxs,
  backgroundColor: colors.background.surfaceless,
  borderColor: colors.border.subtle,
  overflow: "hidden",
  paddingHorizontal: spacing.xs,
  paddingVertical: spacing.xxs,
})

const $helperStyle: ThemedStyle<TextStyle> = () => ({
  // Only text-specific styles here
})

const $rightAccessoryStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginEnd: spacing.xxs,
  flexShrink: 0,
  justifyContent: "center",
  alignItems: "center",
})

const $leftAccessoryStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginStart: spacing.xxs,
  marginEnd: spacing.xxs,
  flexShrink: 0,
  justifyContent: "center",
  alignItems: "center",
})
