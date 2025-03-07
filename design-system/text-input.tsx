import { forwardRef, memo } from "react"
import { TextInput as RNTextInput, TextInputProps as RNTextInputProps } from "react-native"
import { textPresets } from "@/design-system/Text/Text.presets"
import { useAppTheme } from "@/theme/use-app-theme"

export type ITextInputProps = RNTextInputProps

export const TextInput = memo(
  forwardRef(function TextInput(props: ITextInputProps, ref: React.ForwardedRef<RNTextInput>) {
    const { theme, themed } = useAppTheme()

    const { style, cursorColor = theme.colors.text.primary, ...rest } = props

    return (
      <RNTextInput
        ref={ref}
        cursorColor={cursorColor}
        selectionHandleColor={cursorColor}
        selectionColor={cursorColor as string} // Not sure why "as string" is required
        hitSlop={theme.spacing.xs} // By default for better UX
        placeholderTextColor={theme.colors.text.tertiary}
        autoCorrect={false} // By default we don't want auto correct
        style={[
          themed(textPresets["body"]),
          { padding: 0 }, // We want fully control over our TextInput layout
          style,
        ]}
        {...rest}
      />
    )
  }),
)
