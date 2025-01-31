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
    Clipboard.setString(name);
    Alert.alert(translate("profile.copied"));
  };

  const renderSocialChips = (
    items: ISocialName[],
    getValue: (item: ISocialName) => string
  ) => {
    return items?.map((item) => (
      <Chip
        key={getValue(item)}
        name={getValue(item)}
        onPress={() => handleNamePress(getValue(item))}
      />
    ));
  };

  return (
    <VStack style={{ paddingVertical: theme.spacing.sm }}>
      <Text>{translate("profile.names")}</Text>
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
