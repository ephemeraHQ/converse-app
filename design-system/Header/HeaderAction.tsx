import { ReactElement } from "react"
import { TextStyle, View, ViewStyle } from "react-native"
import { IIconName } from "@/design-system/Icon/Icon.types"
import { translate } from "@/i18n"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import { Icon } from "../Icon/Icon"
import { Pressable } from "../Pressable"
import { ITextProps, Text } from "../Text"
import { ITouchableOpacityProps, TouchableOpacity } from "../TouchableOpacity"

type HeaderActionProps = {
  backgroundColor?: string
  icon?: IIconName
  iconColor?: string
  text?: ITextProps["text"]
  tx?: ITextProps["tx"]
  txOptions?: ITextProps["txOptions"]
  onPress?: ITouchableOpacityProps["onPress"]
  ActionComponent?: ReactElement
  style?: ViewStyle
  disabled?: boolean
}
export function HeaderAction(props: HeaderActionProps) {
  const {
    backgroundColor,
    icon,
    text,
    tx,
    txOptions,
    onPress,
    ActionComponent,
    iconColor,
    style,
    disabled,
  } = props
  const { themed, theme } = useAppTheme()

  const content = tx ? translate(tx, txOptions) : text

  if (ActionComponent) return ActionComponent

  const disabledStyle: ViewStyle = disabled ? { opacity: 0.7 } : {}

  if (content) {
    return (
      <TouchableOpacity
        style={[themed([$actionTextContainer, { backgroundColor }]), style, disabledStyle]}
        onPress={onPress}
        disabled={disabled || !onPress}
        activeOpacity={0.8}
        hitSlop={theme.spacing.sm}
      >
        <Text preset="body" text={content} style={themed($actionText)} />
      </TouchableOpacity>
    )
  }

  if (icon) {
    return (
      <Pressable
        // {...debugBorder()}
        onPress={onPress}
        disabled={disabled || !onPress}
        style={[themed([$actionIconContainer, { backgroundColor }]), style, disabledStyle]}
        hitSlop={theme.spacing.sm}
      >
        <Icon size={theme.iconSize.lg} icon={icon} color={iconColor} />
      </Pressable>
    )
  }

  return <View style={[themed($actionFillerContainer), { backgroundColor }, style]} />
}

const $actionTextContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 0,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: spacing.md,
  zIndex: 2,
})

const $actionText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.primary,
})

const $actionIconContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 0,
  alignItems: "center",
  justifyContent: "center",
  height: spacing.xxl,
  width: spacing.xxl,
  zIndex: 2,
})

const $actionFillerContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: spacing.xxs,
})
