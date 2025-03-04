import { memo } from "react"
import { Pressable } from "react-native"
import { Text } from "@/design-system/Text"
import { useAppTheme } from "@/theme/use-app-theme"

export const ProfileContactCardImportName = memo(function ProfileContactCardImportName(props: {
  onPress: () => void
}) {
  const { onPress } = props

  const { theme } = useAppTheme()

  return (
    <Pressable
      hitSlop={theme.spacing.md}
      style={{
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: theme.spacing.xxs,
      }}
      // onPress={openConnectWalletBottomSheet}
      onPress={onPress}
    >
      <Text preset="small" color="secondary" inverted>
        Import
      </Text>
    </Pressable>
  )
})
