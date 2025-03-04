import { memo } from "react"
import { Switch, ViewStyle } from "react-native"
import { Center } from "@/design-system/Center"
import { HStack } from "@/design-system/HStack"
import { Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"

type IOnboardingNotificationRowProps = {
  title: string
  description: string
  disabled?: boolean
  value: boolean
  onToggle: (enabled: boolean) => void
}

const $switchContainer: ViewStyle = {
  flex: 1,
  justifyContent: "flex-end",
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginVertical: spacing.xs,
  marginHorizontal: spacing.xxs,
})

const $textContainer: ViewStyle = {
  flex: 2,
}

export const OnboardingNotificationRow = memo(
  ({ title, description, disabled, onToggle, value }: IOnboardingNotificationRowProps) => {
    const { themed } = useAppTheme()

    return (
      <HStack style={themed($container)}>
        <VStack style={$textContainer}>
          <Text preset="body">{title}</Text>
          <Text preset="small" color={"secondary"}>
            {description}
          </Text>
        </VStack>
        <Center style={$switchContainer}>
          <Switch disabled={disabled} value={value} onValueChange={onToggle} />
        </Center>
      </HStack>
    )
  },
)
