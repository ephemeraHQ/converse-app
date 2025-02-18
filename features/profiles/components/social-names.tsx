import React from "react";
import { Alert, ViewStyle } from "react-native";
import { VStack } from "@/design-system/VStack";
import { HStack } from "@/design-system/HStack";
import { Text } from "@/design-system/Text";
import { Chip } from "@/design-system/chip";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";
import { translate } from "@/i18n";
import Clipboard from "@react-native-clipboard/clipboard";

type ISocialName = {
  name: string;
  domain?: string;
};

type ISocialNamesProps = {
  socials?: {
    userNames?: ISocialName[];
    ensNames?: ISocialName[];
    unstoppableDomains?: ISocialName[];
  };
};

/**
 * Generic presentation component for displaying social names.
 * Handles the rendering and interaction (copy to clipboard) of social names.
 * Kept separate from filtering logic to maintain reusability in different contexts.
 */
export function SocialNames({ socials }: ISocialNamesProps) {
  const { theme, themed } = useAppTheme();

  // Early return if no socials data
  if (
    !socials ||
    ((socials.userNames?.length ?? 0) === 0 &&
      (socials.ensNames?.length ?? 0) === 0 &&
      (socials.unstoppableDomains?.length ?? 0) === 0)
  ) {
    return null;
  }

  const handleNamePress = (name: string) => {
    // Copy name to clipboard
    Clipboard.setString(name);
    Alert.alert(translate("userProfile.copied"));
  };

  const renderSocialChips = (
    items: ISocialName[],
    getValue: (item: ISocialName) => string
  ) => {
    return items?.map((item) => (
      <Chip
        key={getValue(item)}
        onPress={() => handleNamePress(getValue(item))}
      >
        <Chip.Text>{getValue(item)}</Chip.Text>
      </Chip>
    ));
  };

  return (
    <VStack style={{ paddingVertical: theme.spacing.sm }}>
      <Text>{translate("userProfile.names")}</Text>
      <HStack style={themed($chipContainer)}>
        {renderSocialChips(socials.userNames ?? [], (item) => item.name)}
        {renderSocialChips(socials.ensNames ?? [], (item) => item.name)}
        {renderSocialChips(
          socials.unstoppableDomains ?? [],
          (item) => item.domain!
        )}
      </HStack>
    </VStack>
  );
}

const $chipContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexWrap: "wrap",
  gap: spacing.xs,
  paddingTop: spacing.sm,
});
