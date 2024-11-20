import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Platform, View, ViewStyle, ImageStyle } from "react-native";
import { useAppTheme, ThemedStyle } from "@theme/useAppTheme";
import { ProfileSocials } from "@data/store/profilesStore";
import {
  getPreferredAvatar,
  getPreferredName,
  getPrimaryNames,
} from "@utils/profile";
import { shortAddress } from "@utils/str";
import Avatar from "@components/Avatar";
import { NavigationChatButton } from "./NavigationChatButton";
import { Text } from "@design-system/Text";

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
        <View>
          <Text preset="bodyBold" style={{ marginBottom: theme.spacing.xs }}>
            {preferredName || shortAddress(address)}
          </Text>
          {primaryNamesDisplay.length > 0 && (
            <Text
              preset="formLabel"
              numberOfLines={1}
              style={{ marginRight: theme.spacing.lg }}
            >
              {primaryNamesDisplay.join(" | ")}
            </Text>
          )}
        </View>
      </View>
      {navigation && (
        <View style={themed($right)}>
          <NavigationChatButton
            navigation={navigation}
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
  paddingVertical: spacing.base,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
});

const $left: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
});

const $avatar: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  marginRight: spacing.sm,
});

const $right: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  justifyContent: "center",
  marginLeft: Platform.OS === "ios" ? spacing.xl : 0,
});
