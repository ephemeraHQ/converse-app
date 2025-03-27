import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { memo } from "react"
import { Screen } from "@/components/screen/screen"
import { ProfileContactCard } from "@/features/profiles/components/profile-contact-card/profile-contact-card"
import { ProfileSection } from "@/features/profiles/components/profile-section"
import { ProfileSocialsNames } from "@/features/profiles/components/profile-social-names"
import { useProfileOtherScreenHeader } from "@/features/profiles/profile-other.screen-header"
import { useAppTheme } from "@/theme/use-app-theme"

export const ProfileOther = memo(function (props: { inboxId: IXmtpInboxId }) {
  const { inboxId } = props

  const { theme } = useAppTheme()

  useProfileOtherScreenHeader({ inboxId })

  return (
    <Screen preset="fixed" backgroundColor={theme.colors.background.surface}>
      <ProfileSection
        style={{
          paddingHorizontal: 0, // Since the ProfileContactCardLayout already has margin for the shadow
          paddingVertical: 0, // Since the ProfileContactCardLayout already has margin for the shadow
        }}
      >
        <ProfileContactCard inboxId={inboxId} />
      </ProfileSection>

      <ProfileSocialsNames inboxId={inboxId} />
    </Screen>
  )
})
