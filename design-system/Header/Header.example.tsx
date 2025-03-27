import { Icon } from "@design-system/Icon/Icon"
import { Text } from "@design-system/Text/Text"
import { VStack } from "@design-system/VStack"
import { TextStyle } from "react-native"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import { Header } from "./Header"

type IExampleProps = {
  onPress?: () => void
}

export function HeaderExample(args: IExampleProps) {
  const { onPress } = args

  return (
    <VStack>
      {/* Basic Header */}
      <Header title="Basic Header" onLeftPress={onPress} onRightPress={onPress} />

      {/* Header with title and left icon */}
      <Header title="Header with Text" leftIcon="chevron.left" />

      {/* Header with title and right icon */}
      <Header title="Header with Text" rightIcon="chevron.right" />

      {/* Header with left and right icons */}
      <Header
        title="Header with Icons"
        leftIcon="chevron.left"
        rightIcon="chevron.right"
        onLeftPress={onPress}
        onRightPress={onPress}
      />

      {/* Header with custom title, left and right action components */}
      <Header
        titleComponent={<CustomTitle />}
        LeftActionComponent={<CustomLeftAction />}
        RightActionComponent={<CustomRightAction />}
        onLeftPress={onPress}
        onRightPress={onPress}
      />
    </VStack>
  )
}

function CustomTitle() {
  const { themed } = useAppTheme()
  return <Text style={themed($headerTextStyle)}>Custom Header Title Component</Text>
}

function CustomLeftAction() {
  const { theme, themed } = useAppTheme()
  return (
    <Text style={themed($sideTextStyle({ hasLeftText: true, hasRightText: false }))}>
      <Icon size={theme.iconSize.lg} icon="chevron.left" />
    </Text>
  )
}

function CustomRightAction() {
  const { theme, themed } = useAppTheme()
  return (
    <Text style={themed($sideTextStyle({ hasLeftText: false, hasRightText: true }))}>
      <Icon size={theme.iconSize.lg} icon="chevron.right" />
    </Text>
  )
}

const $headerTextStyle: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontWeight: "bold",
  color: colors.text.primary,
})

const $sideTextStyle =
  (props: { hasLeftText: boolean; hasRightText: boolean }): ThemedStyle<TextStyle> =>
  ({ spacing, colors }) => ({
    color: colors.text.secondary,
    marginTop: spacing.xxxs,
    marginHorizontal: props.hasLeftText && props.hasRightText ? spacing.sm : 0,
  })
