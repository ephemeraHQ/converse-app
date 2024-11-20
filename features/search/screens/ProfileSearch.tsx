import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback } from "react";
import {
  FlatList,
  Keyboard,
  Platform,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@design-system/Text";
import { translate } from "@i18n";
import { ProfileSearchItem } from "../components/ProfileSearchItem";
import { ProfileSocials } from "@data/store/profilesStore";
import { useAppTheme, ThemedStyle } from "@theme/useAppTheme";

type ProfileSearchProps = {
  navigation: NativeStackNavigationProp<any>;
  profiles: { [address: string]: ProfileSocials };
  groupMode?: boolean;
  addToGroup?: (member: ProfileSocials & { address: string }) => void;
};

export default function ProfileSearch({
  navigation,
  profiles,
  groupMode,
  addToGroup,
}: ProfileSearchProps) {
  const insets = useSafeAreaInsets();
  const { theme, themed } = useAppTheme();

  const keyExtractor = useCallback((address: string) => address, []);

  const renderItem = useCallback(
    ({ item }: { item: string }) => (
      <ProfileSearchItem
        address={item}
        socials={profiles[item]}
        navigation={navigation}
        groupMode={groupMode}
        addToGroup={addToGroup}
      />
    ),
    [profiles, navigation, groupMode, addToGroup]
  );

  const renderHeader = useCallback(
    () => (
      <View style={themed($sectionTitleContainer)}>
        <Text preset="formLabel" style={themed($sectionTitleSpacing)}>
          {translate("search_results")}
        </Text>
      </View>
    ),
    [themed]
  );

  const renderFooter = useCallback(
    () => (
      <View style={[themed($footer), { marginBottom: insets.bottom + 55 }]}>
        <Text
          preset={Platform.OS === "ios" ? "body" : "small"}
          style={themed($footerText)}
        >
          {translate("full_address_hint", {
            providers: ".converse.xyz, .eth, .lens, .fc, .x",
          })}
        </Text>
      </View>
    ),
    [themed, insets.bottom]
  );

  return (
    <View style={{ paddingLeft: theme.spacing.sm }}>
      <FlatList
        keyboardShouldPersistTaps="handled"
        data={Object.keys(profiles)}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onTouchStart={Keyboard.dismiss}
      />
    </View>
  );
}

const $sectionTitleContainer: ThemedStyle<ViewStyle> = ({
  colors,
  borderWidth,
}) => ({
  ...Platform.select({
    default: {
      borderBottomWidth: borderWidth.sm,
      borderBottomColor: colors.border.subtle,
    },
    android: {},
  }),
});

const $sectionTitleSpacing: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  ...Platform.select({
    default: {
      marginBottom: spacing.sm,
      marginTop: spacing.xl,
    },
    android: {
      marginBottom: spacing.md,
      marginTop: spacing.lg,
    },
  }),
});

const $footer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  ...Platform.select({
    default: {
      marginTop: spacing.xl,
      marginRight: spacing.lg,
    },
    android: {
      marginRight: spacing.lg,
      marginLeft: spacing.lg,
      marginTop: spacing.lg,
    },
  }),
});

const $footerText: ThemedStyle<TextStyle> = () => ({
  textAlign: Platform.OS === "ios" ? "center" : "left",
});
