import { Avatar } from "@/components-name/avatar";
import { Text } from "@/design-system/Text";
import { VStack } from "@/design-system/VStack";
import { ProfileContactCardLayout } from "@/features/profiles/components/profile-contact-card/profile-contact-card-layout";
import { useProfileQuery } from "@/features/profiles/profiles.query";
import { useAppTheme } from "@/theme/use-app-theme";
import React, { memo } from "react";
import { IProfileContactCardProps } from "../../profile.types";

/**
 * Generic profile contact card that we'll use for both my profile and other profiles
 */
export const ProfileContactCard = memo(function ProfileContactCard({
  inboxId,
}: IProfileContactCardProps) {
  const { data: profile } = useProfileQuery({
    xmtpId: inboxId,
  });

  const { theme } = useAppTheme();

  const content = (
    <VStack style={{ marginTop: theme.spacing.md }}>
      <Text
        preset="bodyBold"
        style={{
          color: theme.colors.text.inverted.primary,
          marginBottom: theme.spacing.xxxs,
        }}
      >
        {profile?.name}
      </Text>
      {/* TODO: Add main address */}
      {/* {profile?.username && (
        <Text inverted color="secondary" preset="smaller">
          {profile?.username}
        </Text>
      )} */}
    </VStack>
  );

  return (
    <ProfileContactCardLayout
      avatar={
        <Avatar
          uri={profile?.avatar}
          name={profile?.name}
          size={theme.avatarSize.lg}
        />
      }
      name={content}
    />
  );
});
