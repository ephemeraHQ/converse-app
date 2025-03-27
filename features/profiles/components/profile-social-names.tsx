import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import Clipboard from "@react-native-clipboard/clipboard"
import React from "react"
import { Alert, ViewStyle } from "react-native"
import { showActionSheet } from "@/components/action-sheet"
import { Chip, ChipAvatar, ChipText } from "@/design-system/chip"
import { HStack } from "@/design-system/HStack"
import { Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { useSocialProfilesForInboxId } from "@/features/social-profiles/hooks/use-social-profiles-for-inbox-id"
import { supportedSocialProfiles } from "@/features/social-profiles/supported-social-profiles"
import { translate } from "@/i18n"
import { ThemedStyle, useAppTheme } from "@/theme/use-app-theme"
import { captureErrorWithToast } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"

type IProfileSocialsNamesProps = {
  inboxId: IXmtpInboxId
}

export function ProfileSocialsNames({ inboxId }: IProfileSocialsNamesProps) {
  const { theme, themed } = useAppTheme()

  const { data: socialProfiles } = useSocialProfilesForInboxId({
    inboxId,
  })

  const handleNamePress = (name: string) => {
    showActionSheet({
      options: {
        options: ["Copy address", "Remove from inbox", "Cancel"],
        cancelButtonIndex: 2,
      },
      callback: async (selectedIndex) => {
        if (selectedIndex === 0) {
          try {
            Clipboard.setString(name)
            Alert.alert(translate("userProfile.copied"))
          } catch (error) {
            captureErrorWithToast(
              new GenericError({ error, additionalMessage: "Error copying address" }),
            )
          }
        } else if (selectedIndex === 1) {
          try {
            Alert.alert("Work in progress")
          } catch (error) {
            captureErrorWithToast(
              new GenericError({ error, additionalMessage: "Error removing wallet from inbox" }),
            )
          }
        }
      },
    })
  }

  if (!socialProfiles || socialProfiles.length === 0) {
    return null
  }

  return (
    <VStack style={[themed($section), themed($borderTop)]}>
      <VStack style={{ paddingVertical: theme.spacing.sm }}>
        <Text>{translate("userProfile.names")}</Text>
        <HStack style={themed($chipContainer)}>
          {socialProfiles.map((socialProfile) => (
            <Chip
              key={`${socialProfile.name}-${socialProfile.type}`}
              onPress={() => handleNamePress(socialProfile.name)}
            >
              <ChipAvatar
                name={socialProfile.name}
                source={
                  socialProfile.avatar
                    ? { uri: socialProfile.avatar }
                    : supportedSocialProfiles.find((profile) => profile.type === socialProfile.type)
                        ?.imageLocalUri
                }
              />
              <ChipText>{socialProfile.name}</ChipText>
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
