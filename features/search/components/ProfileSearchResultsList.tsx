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
import { ProfileSearchResultListItem } from "./ProfileSearchItem";
import { IProfileSocials } from "@/features/profiles/profile-types";
import { useAppTheme, ThemedStyle } from "@theme/useAppTheme";

type ProfileSearchProps = {
  profiles: { [address: string]: IProfileSocials };
  handleSearchResultItemPress: (args: {
    address: string;
    socials: IProfileSocials;
  }) => void;
};

export function ProfileSearchResultsList({
  profiles,
  handleSearchResultItemPress,
}: ProfileSearchProps) {
  const insets = useSafeAreaInsets();
  const { theme, themed } = useAppTheme();

  const keyExtractor = useCallback((address: string) => address, []);

  const renderItem = useCallback(
    ({ item: searchResultEthereumAddress }: { item: string }) => (
      <ProfileSearchResultListItem
        address={searchResultEthereumAddress}
        socials={profiles[searchResultEthereumAddress]}
        handleSearchResultItemPress={handleSearchResultItemPress}
      />
    ),
    [profiles, handleSearchResultItemPress]
  );

  // const renderHeader = useCallback(
  //   () => (
  //     <View style={themed($sectionTitleContainer)}>
  //       <Text preset="formLabel" style={themed($sectionTitleSpacing)}>
  //         {translate("search_results")}
  //       </Text>
  //     </View>
  //   ),
  //   [themed]
  // );

  // const renderFooter = useCallback(
  //   () => (
  //     <View style={[themed($footer), { marginBottom: insets.bottom }]}>
  //       <Text
  //         preset={Platform.OS === "ios" ? "body" : "small"}
  //         style={{ textAlign: Platform.OS === "ios" ? "center" : "left" }}
  //       >
  //         {translate("full_address_hint", {
  //           providers: ".converse.xyz, .eth, .lens, .fc, .x",
  //         })}
  //       </Text>
  //     </View>
  //   ),
  //   [themed, insets.bottom]
  // );

  return (
    <View style={{ paddingLeft: theme.spacing.sm }}>
      <FlatList
        keyboardShouldPersistTaps="handled"
        data={Object.keys(profiles)}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        // ListHeaderComponent={renderHeader}
        // ListFooterComponent={renderFooter}
        // onTouchStart={Keyboard.dismiss}
        // showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// const $sectionTitleContainer: ThemedStyle<ViewStyle> = ({
//   colors,
//   borderWidth,
// }) => ({
//   ...Platform.select({
//     default: {
//       borderBottomWidth: borderWidth.sm,
//       borderBottomColor: colors.border.subtle,
//     },
//     android: {},
//   }),
// });

// const $sectionTitleSpacing: ThemedStyle<TextStyle> = ({ spacing }) => ({
//   marginBottom: spacing.xs,
//   marginTop: spacing.lg,
// });

// const $footer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
//   ...Platform.select({
//     default: {
//       marginTop: spacing.xl,
//       marginRight: spacing.lg,
//     },
//     android: {
//       marginRight: spacing.lg,
//       marginLeft: spacing.lg,
//       marginTop: spacing.lg,
//     },
//   }),
// });
