import { Avatar } from "@/components/Avatar";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { ProfileContactCardLayout } from "@/features/profiles/components/profile-contact-card/profile-contact-card-layout";
import { useInboxUsername } from "@/features/profiles/utils/inbox-username";
import { usePreferredInboxAvatar } from "@/hooks/usePreferredInboxAvatar";
import { usePreferredInboxName } from "@/hooks/usePreferredInboxName";
import { useAppTheme } from "@/theme/useAppTheme";
import React, { memo } from "react";
import { IProfileContactCardProps } from "../../profile.types";

/**
 * Generic profile contact card that we'll use for both my profile and other profiles
 */
export const ProfileContactCard = memo(function ProfileContactCard({
  inboxId,
}: IProfileContactCardProps) {
  const { data: avatarUri } = usePreferredInboxAvatar({ inboxId });
  const { data: displayName } = usePreferredInboxName({ inboxId });
  const { data: username } = useInboxUsername({ inboxId });

  const { theme } = useAppTheme();

  const avatar = (
    <Avatar uri={avatarUri} name={displayName} size={theme.avatarSize.lg} />
  );

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
          {username}
        </Text>
      )}
    </VStack>
  );

  return <ProfileContactCardLayout avatar={avatar} name={content} />;
});
