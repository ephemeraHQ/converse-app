import Clipboard from "@react-native-clipboard/clipboard"
import React, { useMemo } from "react"
import { Alert, ViewStyle } from "react-native"
import { Chip, ChipText } from "@/design-system/chip"
import { HStack } from "@/design-system/HStack"
import { Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { ISocialProfile } from "@/features/social-profiles/social-profiles.api"
import { translate } from "@/i18n"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"

type IProfileSocialsNamesProps = {
  socialProfiles: ISocialProfile[]
}

export function ProfileSocialsNames({
  socialProfiles,
}: IProfileSocialsNamesProps) {
  const { theme, themed } = useAppTheme()

  // Group valid social profiles by name
  const profilesByName = useMemo(() => {
    return socialProfiles.reduce(
      (acc, profile) => {
        if (profile.name) {
          acc.push({ name: profile.name })
        }
        return acc
      },
      [] as { name: string }[],
    )
  }, [socialProfiles])

  if (profilesByName.length === 0) {
    return null
  }

  const handleNamePress = (name: string) => {
    Clipboard.setString(name)
    Alert.alert(translate("userProfile.copied"))
  }

  return (
    <VStack style={[themed($section), themed($borderTop)]}>
      <VStack style={{ paddingVertical: theme.spacing.sm }}>
        <Text>{translate("userProfile.names")}</Text>
        <HStack style={themed($chipContainer)}>
          {profilesByName.map((item) => (
            <Chip key={item.name} onPress={() => handleNamePress(item.name)}>
              <ChipText>{item.name}</ChipText>
            </Chip>
          ))}
        </HStack>
      </VStack>
    </VStack>
  )
}

const $section: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.background.surface,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.xs,
})

const $borderTop: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  borderTopWidth: spacing.xxs,
  borderTopColor: colors.background.sunken,
})

const $chipContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexWrap: "wrap",
  gap: spacing.xs,
  paddingTop: spacing.sm,
})
