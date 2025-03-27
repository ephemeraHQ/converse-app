import { memo } from "react"
import { ViewStyle } from "react-native"
import { IVStackProps, VStack } from "@/design-system/VStack"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"

export const ProfileSection = memo(function ProfileSection(
  props: IVStackProps & {
    withTopBorder?: boolean
  },
) {
  const { withTopBorder, ...rest } = props

  const { themed } = useAppTheme()

  return <VStack style={[themed($section), withTopBorder && themed($borderTop)]} {...rest} />
})

const $section: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.background.surface,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.xs,
})

const $borderTop: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  borderTopWidth: spacing.xxs,
  borderTopColor: colors.background.sunken,
})
