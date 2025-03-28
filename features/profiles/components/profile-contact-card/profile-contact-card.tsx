import React, { memo } from "react"
import { Avatar } from "@/components/avatar"
import { Text } from "@/design-system/Text"
import { VStack } from "@/design-system/VStack"
import { usePreferredDisplayInfo } from "@/features/preferred-display-info/use-preferred-display-info"
import { ProfileContactCardLayout } from "@/features/profiles/components/profile-contact-card/profile-contact-card-layout"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { useAppTheme } from "@/theme/use-app-theme"

type IProfileContactCardProps = {
  inboxId: IXmtpInboxId
}

/**
 * Generic profile contact card that we'll use for both my profile and other profiles
 */
export const ProfileContactCard = memo(function ProfileContactCard({
  inboxId,
}: IProfileContactCardProps) {
  const { displayName, avatarUrl, username } = usePreferredDisplayInfo({
    inboxId,
  })

  const { theme } = useAppTheme()

  const content = (
    <VStack style={{ marginTop: theme.spacing.md }}>
      <Text
        preset="bodyBold"
        style={{
          color: theme.colors.text.inverted.primary,
          marginBottom: theme.spacing.xxxs,
        }}
      >
        {displayName}
      </Text>
      {username && (
        <Text inverted color="secondary" preset="smaller">
          @{username}
        </Text>
      )}
    </VStack>
  )

  return (
    <ProfileContactCardLayout
      avatar={
        <Avatar uri={avatarUrl ?? null} name={displayName} sizeNumber={theme.avatarSize.lg} />
      }
      name={content}
    />
  )
})
