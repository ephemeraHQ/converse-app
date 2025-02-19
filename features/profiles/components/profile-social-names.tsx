import React from "react";
import { Alert, ViewStyle } from "react-native";
import { VStack } from "@/design-system/VStack";
import { HStack } from "@/design-system/HStack";
import { Text } from "@/design-system/Text";
import { Chip, ChipText } from "@/design-system/chip";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { translate } from "@/i18n";
import Clipboard from "@react-native-clipboard/clipboard";
import { IWeb3SocialProfile } from "@/features/social-profiles/social-lookup.api";

type ISocialName = {
  name: string;
  domain?: string;
};

type IProfileSocialsNamesProps = {
  socialProfiles: IWeb3SocialProfile[];
};

export function ProfileSocialsNames({
  socialProfiles,
}: IProfileSocialsNamesProps) {
  const { theme, themed } = useAppTheme();

  // Get ENS names from profiles
  const ensNames = socialProfiles
    .filter((p) => p.type === "ens")
    .map((p) => ({
      name: p.name ?? "",
    }))
    .filter((p) => p.name);

  // Get Farcaster usernames
  const farcasterNames = socialProfiles
    .filter((p) => p.type === "farcaster")
    .map((p) => ({
      name: p.name ?? "",
    }))
    .filter((p) => p.name);

  // Get Lens usernames
  const lensNames = socialProfiles
    .filter((p) => p.type === "lens")
    .map((p) => ({
      name: p.name ?? "",
    }))
    .filter((p) => p.name);

  if (
    farcasterNames.length === 0 &&
    lensNames.length === 0 &&
    ensNames.length === 0
  ) {
    return null;
  }

  const handleNamePress = (name: string) => {
    Clipboard.setString(name);
    Alert.alert(translate("userProfile.copied"));
  };

  const renderSocialChips = (items: ISocialName[]) => {
    return items.map((item) => (
      <Chip key={item.name} onPress={() => handleNamePress(item.name)}>
        <ChipText>{item.name}</ChipText>
      </Chip>
    ));
  };

  return (
    <VStack style={[themed($section), themed($borderTop)]}>
      <VStack style={{ paddingVertical: theme.spacing.sm }}>
        <Text>{translate("userProfile.names")}</Text>
        <HStack style={themed($chipContainer)}>
          {farcasterNames.length > 0 && renderSocialChips(farcasterNames)}
          {lensNames.length > 0 && renderSocialChips(lensNames)}
          {ensNames.length > 0 && renderSocialChips(ensNames)}
        </HStack>
      </VStack>
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

const $chipContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexWrap: "wrap",
  gap: spacing.xs,
  paddingTop: spacing.sm,
});
