import { useScrollToTop } from "@react-navigation/native"
import React, { useRef } from "react"
import { ScrollView, View, ViewStyle } from "react-native"
import { KeyboardAwareScrollView } from "react-native-keyboard-controller"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { VStack } from "../../design-system/VStack"
import { useAppTheme } from "../../theme/use-app-theme"
import { isNonScrolling, useAutoPreset, useSafeAreaInsetsStyle } from "./screen.helpers"
import { AutoScreenProps, IScreenProps, ScrollScreenProps } from "./screen.props"

function ScreenWithoutScrolling(props: IScreenProps) {
  const { style, contentContainerStyle, children } = props
  return (
    <View style={[$outerStyle, style]}>
      <View style={[$innerStyle, contentContainerStyle]}>{children}</View>
    </View>
  )
}

function ScreenWithScrolling(props: IScreenProps) {
  const insets = useSafeAreaInsets()
  const { theme } = useAppTheme()

  const {
    children,
    keyboardShouldPersistTaps = "handled",
    contentContainerStyle,
    ScrollViewProps,
    keyboardOffset = insets.bottom +
      // By default we never want the input hugging the keyboard
      theme.spacing.xs,
    style,
  } = props as ScrollScreenProps

  const ref = useRef<ScrollView>(null)

  const { scrollEnabled, onContentSizeChange, onLayout } = useAutoPreset(props as AutoScreenProps)

  // Add native behavior of pressing the active tab to scroll to the top of the content
  // More info at: https://reactnavigation.org/docs/use-scroll-to-top/
  useScrollToTop(ref)

  return (
    <KeyboardAwareScrollView
      bottomOffset={keyboardOffset}
      {...{ keyboardShouldPersistTaps, scrollEnabled, ref }}
      {...ScrollViewProps}
      onLayout={(e) => {
        onLayout(e)
        ScrollViewProps?.onLayout?.(e)
      }}
      onContentSizeChange={(w: number, h: number) => {
        onContentSizeChange(w, h)
        ScrollViewProps?.onContentSizeChange?.(w, h)
      }}
      showsVerticalScrollIndicator={false}
      style={[$outerStyle, ScrollViewProps?.style, style]}
      contentContainerStyle={[
        $innerStyle,
        ScrollViewProps?.contentContainerStyle,
        contentContainerStyle,
      ]}
    >
      {children}
    </KeyboardAwareScrollView>
  )
}

/**
 * Represents a screen component that provides a consistent layout and behavior for different screen presets.
 * The `Screen` component can be used with different presets such as "fixed", "scroll", or "auto".
 * It handles safe area insets, keyboard avoiding behavior, and scrollability based on the preset.
 * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Screen/}
 */
export function Screen(props: IScreenProps) {
  const { theme } = useAppTheme()
  const { backgroundColor = theme.colors.background.surfaceless, safeAreaEdges } = props

  const $containerInsets = useSafeAreaInsetsStyle(safeAreaEdges)

  return (
    <VStack style={[$containerStyle, { backgroundColor }, $containerInsets]}>
      {isNonScrolling(props.preset) ? (
        <ScreenWithoutScrolling {...props} />
      ) : (
        <ScreenWithScrolling {...props} />
      )}
    </VStack>
  )
}

const $containerStyle: ViewStyle = {
  flex: 1,
  height: "100%",
  width: "100%",
}

const $outerStyle: ViewStyle = {
  flex: 1,
  height: "100%",
  width: "100%",
}

const $innerStyle: ViewStyle = {
  justifyContent: "flex-start",
  alignItems: "stretch",
}
