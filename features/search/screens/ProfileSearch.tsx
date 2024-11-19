import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback } from "react";
import {
  FlatList,
  Keyboard,
  Platform,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProfileSearchItem } from "../components/ProfileSearchItem";
import { ProfileSocials } from "@data/store/profilesStore";
import { useAppTheme, ThemedStyle } from "@theme/useAppTheme";

export default function ProfileSearch({
  navigation,
  profiles,
  groupMode,
  addToGroup,
}: {
  navigation: NativeStackNavigationProp<any>;
  profiles: { [address: string]: ProfileSocials };
  groupMode?: boolean;
  addToGroup?: (member: ProfileSocials & { address: string }) => void;
}) {
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

  const renderHeader = () => (
    <View style={themed($sectionTitleContainer)}>
      <Text style={themed($sectionTitle)}>RESULTS</Text>
    </View>
  );

  const renderFooter = () => (
    <View style={[themed($footer), { marginBottom: insets.bottom + 55 }]}>
      <Text style={themed($message)}>
        If you don't see your contact in the list, try typing their full address
        (with .converse.xyz, .eth, .lens, .fc, .x etc…)
      </Text>
    </View>
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

const $sectionTitleContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  ...Platform.select({
    default: {
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border.subtle,
    },
    android: {},
  }),
});

const $sectionTitle: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  color: colors.text.secondary,
  ...Platform.select({
    default: {
      fontSize: 12,
      marginBottom: spacing.sm,
      marginTop: spacing.xl,
    },
    android: {
      fontSize: 11,
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

const $message: ThemedStyle<TextStyle> = ({ colors }) => ({
  ...Platform.select({
    default: {
      fontSize: 17,
      textAlign: "center",
    },
    android: {
      fontSize: 14,
    },
  }),
  color: colors.text.secondary,
});
