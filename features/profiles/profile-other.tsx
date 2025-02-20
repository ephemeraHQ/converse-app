import { Screen } from "@/components/Button/screen/screen";
import { ProfileContactCard } from "@/features/profiles/components/profile-contact-card/profile-contact-card";
import { ProfileSection } from "@/features/profiles/components/profile-section";
import { ProfileSocialsNames } from "@/features/profiles/components/profile-social-names";
import { useProfileOtherScreenHeader } from "@/features/profiles/profile-other.screen-header";
import { useProfileQuery } from "@/features/profiles/profiles.query";
import { useSocialProfilesForAddressQuery } from "@/features/social-profiles/social-lookup.query";
import { useAppTheme } from "@/theme/useAppTheme";
import { InboxId } from "@xmtp/react-native-sdk";
import { memo } from "react";

export const ProfileOther = memo(function (props: { inboxId: InboxId }) {
  const { inboxId } = props;

  const { theme } = useAppTheme();

  useProfileOtherScreenHeader({ inboxId });

  const { data: profile } = useProfileQuery({ xmtpId: inboxId });

  const { data: socialProfiles } = useSocialProfilesForAddressQuery({
    ethAddress: profile?.privyAddress,
  });

  return (
    <Screen preset="fixed" backgroundColor={theme.colors.background.surface}>
      <ProfileSection>
        <ProfileContactCard inboxId={inboxId} />
      </ProfileSection>

      {socialProfiles && (
        <ProfileSocialsNames socialProfiles={socialProfiles} />
      )}
    </Screen>
  );
});
