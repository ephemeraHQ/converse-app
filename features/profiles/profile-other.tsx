import { Screen } from "@/components/Screen/ScreenComp/Screen";
import { ProfileContactCard } from "@/features/profiles/components/profile-contact-card/profile-contact-card";
import { ProfileSection } from "@/features/profiles/components/profile-section";
import { ProfileSocialsNames } from "@/features/profiles/components/profile-social-names";
import { useProfileOtherScreenHeader } from "@/features/profiles/profile-other.screen-header";
import { useInboxProfileSocialsQuery } from "@/queries/useInboxProfileSocialsQuery";
import { useAppTheme } from "@/theme/useAppTheme";
import { InboxId } from "@xmtp/react-native-sdk";
import { memo } from "react";

export const ProfileOther = memo(function (props: { inboxId: InboxId }) {
  const { inboxId } = props;

  const { theme } = useAppTheme();

  useProfileOtherScreenHeader({ inboxId });

  const { data: socials } = useInboxProfileSocialsQuery({
    inboxId,
    caller: "ProfileOther",
  });

  return (
    <Screen preset="fixed" backgroundColor={theme.colors.background.surface}>
      <ProfileSection>
        <ProfileContactCard inboxId={inboxId} />
      </ProfileSection>

      {socials && <ProfileSocialsNames socials={socials[0]} />}
    </Screen>
  );
});
