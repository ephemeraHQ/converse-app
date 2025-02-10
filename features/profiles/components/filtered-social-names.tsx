import { VStack } from "@/design-system/VStack";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { formatConverseUsername } from "../utils/format-converse-username";
import { SocialNames } from "./social-names";
import { IProfileSocials } from "../profile-types";
import { ViewStyle } from "react-native";

type IFilteredSocialNamesProps = {
  socials: IProfileSocials;
};

/**
 * Container component that handles the business logic for filtering social names.
 * Kept separate from SocialNames to:
 * - Maintain separation of concerns (filtering vs presentation)
 * - Allow SocialNames to be reused in contexts where filtering isn't needed
 * - Keep profile-specific filtering logic isolated
 */
export function FilteredSocialNames({ socials }: IFilteredSocialNamesProps) {
  const { themed } = useAppTheme();

  // Filter out Converse usernames
  const filteredUserNames = socials.userNames?.filter(
    (u) => !formatConverseUsername(u.name)?.isConverseUsername
  );

  // Filter out .eth domains from unstoppable domains to avoid duplicates
  const filteredUnstoppableDomains = socials.unstoppableDomains?.filter(
    (d) => d.domain && !d.domain.toLowerCase().endsWith(".eth")
  );

  // Only render if there are names to display after filtering
  if (
    (filteredUserNames?.length ?? 0) > 0 ||
    (socials.ensNames?.length ?? 0) > 0 ||
    (filteredUnstoppableDomains?.length ?? 0) > 0
  ) {
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

  return null;
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
