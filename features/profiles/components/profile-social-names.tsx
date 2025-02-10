import { VStack } from "@/design-system/VStack";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { formatConverseUsername } from "../utils/format-converse-username";
import { SocialNames } from "./social-names";
import { IProfileSocials } from "../profile.types";
import { ViewStyle } from "react-native";

type IProfileSocialsNamesProps = {
  socials: IProfileSocials;
};

export function ProfileSocialsNames({ socials }: IProfileSocialsNamesProps) {
  const { themed } = useAppTheme();

  // Filter out Converse usernames
  const filteredUserNames = socials.userNames?.filter(
    (u) => !formatConverseUsername(u.name)?.isConverseUsername
  );

  // Filter out .eth domains from unstoppable domains to avoid duplicates
  const filteredUnstoppableDomains = socials.unstoppableDomains?.filter(
    (d) => d.domain && !d.domain.toLowerCase().endsWith(".eth")
  );

  if (
    (filteredUserNames?.length ?? 0) === 0 &&
    (socials.ensNames?.length ?? 0) === 0 &&
    (filteredUnstoppableDomains?.length ?? 0) === 0
  ) {
    return null;
  }

  return (
    <VStack style={[themed($section), themed($borderTop)]}>
      <SocialNames
        socials={{
          userNames: filteredUserNames?.map((u) => ({
            name: u.name,
          })),
          ensNames: socials.ensNames?.map((e) => ({
            name: e.name,
          })),
          unstoppableDomains: filteredUnstoppableDomains?.map((d) => ({
            name: d.domain,
          })),
        }}
      />
    </VStack>
  );
}

const $section: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.background.surface,
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.xs,
});

const $borderTop: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  borderTopWidth: spacing.xxs,
  borderTopColor: colors.background.sunken,
});
