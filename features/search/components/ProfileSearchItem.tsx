import { shortAddress } from "@/utils/strings/shortAddress";
import Avatar from "@components/Avatar";
import { ProfileSocials } from "@data/store/profilesStore";
import { Text } from "@design-system/Text";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThemedStyle, useAppTheme } from "@theme/useAppTheme";
import {
  getPreferredAvatar,
  getPreferredName,
  getPrimaryNames,
} from "@utils/profile";
import { ImageStyle, Platform, View, ViewStyle } from "react-native";
import { NavigationChatButton } from "./NavigationChatButton";

type ProfileSearchItemProps = {
  address: string;
  socials: ProfileSocials;
  navigation?: NativeStackNavigationProp<any>;
  groupMode?: boolean;
  addToGroup?: (member: ProfileSocials & { address: string }) => void;
};

export function ProfileSearchItem({
  address,
  socials,
  navigation,
  groupMode,
  addToGroup,
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
      {navigation && (
        <View style={themed($right)}>
          <NavigationChatButton
            address={address}
            groupMode={groupMode}
            addToGroup={
              addToGroup ? () => addToGroup({ ...socials, address }) : undefined
            }
          />
        </View>
      )}
    </View>
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

const $avatar: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  marginRight: spacing.sm,
});

const $right: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  justifyContent: "center",
  marginLeft: Platform.OS === "ios" ? spacing.md : 0,
});
