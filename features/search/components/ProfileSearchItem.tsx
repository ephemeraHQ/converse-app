import { shortAddress } from "@/utils/strings/shortAddress";
import { Avatar } from "@components/Avatar";
import { IProfileSocials } from "@/features/profiles/profile-types";
import { Text } from "@design-system/Text";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import {
  getPreferredAvatar,
  getPreferredName,
  getPrimaryNames,
} from "@utils/profile";
import { Platform, View, ViewStyle, TextStyle } from "react-native";
import { Pressable } from "@/design-system/Pressable";
import logger from "@/utils/logger";

type ProfileSearchItemProps = {
  address: string;
  socials: IProfileSocials;
  handleSearchResultItemPress: (args: {
    address: string;
    socials: IProfileSocials;
  }) => void;
};

/**
 * Figma: https://www.figma.com/design/p6mt4tEDltI4mypD3TIgUk/Converse-App?node-id=5191-4200&t=KDRZMuK1xpiNBKG9-11
 */
export function ProfileSearchResultListItem({
  address,
  socials,
  handleSearchResultItemPress,
}: ProfileSearchItemProps) {
  const { theme, themed } = useAppTheme();
  const preferredName = getPreferredName(socials, address);
  const preferredAvatar = getPreferredAvatar(socials);
  const primaryNames = getPrimaryNames(socials);
  const primaryNamesDisplay = [
    ...primaryNames.filter((name) => name !== preferredName),
    shortAddress(address),
  ];

  return (
    <Pressable
      onPress={() => {
        logger.info("ProfileSearchResultListItem onPress", {
          address,
          socials,
        });
        handleSearchResultItemPress({
          address,
          socials,
        });
      }}
    >
      <View key={address} style={themed($container)}>
        <Avatar
          uri={preferredAvatar}
          size={theme.avatarSize.md}
          style={themed($avatar)}
          name={preferredName}
        />
        <View style={themed($textContainer)}>
          <Text
            preset="bodyBold"
            style={themed($primaryText)}
            numberOfLines={1}
          >
            {preferredName}
          </Text>
          <Text
            preset="formLabel"
            style={themed($secondaryText)}
            numberOfLines={1}
          >
            {primaryNamesDisplay[0]}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const $container: ThemedStyle<ViewStyle> = ({
  colors,
  spacing,
  borderWidth,
}) => ({
  borderBottomWidth: borderWidth.sm,
  borderBottomColor: colors.border.subtle,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  flexDirection: "row",
  justifyContent: "flex-start",
  alignItems: "center",
  backgroundColor: colors.background.surface,
  gap: spacing.sm,
});

const $textContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  minWidth: 0,
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "flex-start",
});

const $avatar: ThemedStyle<ViewStyle> = () => ({
  width: 40,
  height: 40,
  borderRadius: 24,
  overflow: "hidden",
});

const $primaryText: ThemedStyle<TextStyle> = () => ({
  lineHeight: 20,
});

const $secondaryText: ThemedStyle<TextStyle> = ({ colors }) => ({
  lineHeight: 18,
  color: colors.text.secondary,
  fontSize: 14,
});
