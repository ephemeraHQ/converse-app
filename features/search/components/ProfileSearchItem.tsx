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
import { Platform, View, ViewStyle } from "react-native";
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
          /** todo probably just address */ socials,
        });
      }}
    >
      <View key={address} style={themed($container)}>
        <View style={themed($left)}>
          <Avatar
            uri={preferredAvatar}
            size={theme.spacing["3xl"]}
            style={themed($avatar)}
            name={preferredName}
          />
          <View style={themed($textContainer)}>
            <Text preset="bodyBold" numberOfLines={1}>
              {preferredName}
            </Text>
            {primaryNamesDisplay.length > 0 && (
              <Text preset="formLabel" numberOfLines={1}>
                {primaryNamesDisplay.join(" | ")}
              </Text>
            )}
          </View>
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
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
});

const $left: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
});

const $textContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  minWidth: 0,
});

const $avatar: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.sm,
});

const $right: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  justifyContent: "center",
  marginLeft: Platform.OS === "ios" ? spacing.md : 0,
});
