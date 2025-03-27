import { TextStyle, ViewStyle } from "react-native"
import { flattenThemedStyles, Theme, ThemedStyle } from "../../theme/use-app-theme"
import { textPresets } from "./../Text/Text.presets"
import { IButtonAction, IButtonSize, IButtonVariant } from "./Button.props"

type IButtonStyleProps = {
  variant: IButtonVariant
  size: IButtonSize
  action: IButtonAction
  pressed?: boolean
  disabled?: boolean
}

export const $buttonRightAccessoryStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginStart: spacing.xs,
  zIndex: 1,
})

export const $buttonLeftAccessoryStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginEnd: spacing.xs,
  zIndex: 1,
})

export const getButtonViewStyle =
  ({ variant, size, action, pressed = false, disabled = false }: IButtonStyleProps) =>
  (theme: Theme): ViewStyle => {
    const { spacing, colors, borderRadius } = theme

    const style: ViewStyle = {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: borderRadius.sm,
      overflow: "hidden",
      paddingVertical: size === "md" || size === "sm" ? spacing.xxs : spacing.xs,
      paddingHorizontal: size === "md" || size === "sm" ? spacing.xs : spacing.sm,
    }

    // Special case for bare link text buttons - no padding or other decorations
    if (variant === "link.bare") {
      return {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.xxs,
      }
    }

    if (action === "primary") {
      switch (variant) {
        case "fill":
          style.backgroundColor = colors.fill.primary
          if (pressed) {
            style.backgroundColor = colors.fill.secondary
          }
          if (disabled) {
            style.backgroundColor = colors.fill.tertiary
          }
          break

        case "outline":
          style.borderWidth = 1
          style.borderColor = colors.border.secondary
          style.backgroundColor = "transparent"
          if (pressed) {
            style.backgroundColor = colors.fill.minimal
          }
          break

        case "link":
        case "text":
          style.backgroundColor = "transparent"
          // Put back when we're done refactoring all the variant="text" button
          // if (pressed) {
          //   style.backgroundColor = colors.fill.minimal;
          // }
          // Temporary opacity change for the variant="text" button
          if (pressed) {
            style.opacity = 0.8
          }
          break

        default:
          break
      }
    }

    return style
  }

export const getButtonTextStyle =
  ({ size, variant, action, pressed = false, disabled = false }: IButtonStyleProps) =>
  (theme: Theme): TextStyle => {
    const { colors } = theme

    const style: TextStyle = {
      // ...(size === "sm" ? textPresets.title.flat(3) : textPresets.body.flat(3)),
      ...flattenThemedStyles({
        styles: size === "sm" || size === "md" ? textPresets.small : textPresets.body,
        theme,
      }),
      textAlign: "center",
      flexShrink: 1,
      flexGrow: 0,
      zIndex: 2,
    }

    if (action === "primary") {
      switch (variant) {
        case "fill":
          style.color = colors.text.inverted.primary
          break

        case "outline":
          style.color = colors.text.primary
          if (disabled) {
            style.color = colors.fill.tertiary
          }
          break

        case "link":
        case "text":
          style.color = colors.text.primary
          if (disabled) {
            style.color = colors.fill.tertiary
          }
          break

        default:
          break
      }
    }

    return style
  }

// Cursor query
// Ok I'll tell you some styling instruction and please make sure the styles are done correctly. All of those are for action = primary. We don't have other styling yet for the action = danger. Also don,t forget the size (lg or md)
// if variant is filled. background is is fill.primary and text is text.inverted.primary. If pressed is true, fill is secondary, no opacity change. if disabled fill is tertiary, no opacity change. and the text stays the same.
// if variant is outline, border is border.secondary, text is text.primary and background transparent. if pressed is true , background is fill.minimal. if disabled, text is fill.tertiary, border is border.secondary, background is transparent.
// if variant is link, background is transparent, text is primary. if pressed = true, background is now fill.minimal. if disabled, text is fill.tertiary.
