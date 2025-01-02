import { IProfileSocials } from "@/features/profiles/profile-types";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  Platform,
  View,
  ViewStyle,
  TextStyle,
} from "react-native";
import * as Linking from "expo-linking";

import { Recommendation } from "./Recommendation";
import config from "@config";
import {
  useAccountsStore,
  useCurrentAccount,
  useRecommendationsStore,
} from "@data/store/accountsStore";
import { useSelect } from "@data/store/storeHelpers";
import { useRouter } from "@navigation/useNavigation";
import { refreshRecommendationsForAccount } from "@utils/recommendations";
import { translate } from "@/i18n";
import { Text } from "@design-system/Text";
import { Loader } from "@/design-system/loader";
import { ThemedStyle, useAppTheme } from "@/theme/useAppTheme";

const EXPIRE_AFTER = 86400000; // 1 DAY

export default function Recommendations({
  visibility,
  groupMode,
  groupMembers,
  addToGroup,
  showTitle = true,
}: {
  visibility: "FULL" | "EMBEDDED" | "HIDDEN";
  groupMode?: boolean;
  groupMembers?: (IProfileSocials & { address: string })[];
  addToGroup?: (member: IProfileSocials & { address: string }) => void;
  showTitle?: boolean;
}) {
  const navigation = useRouter();

  const userAddress = useCurrentAccount();
  const currentAccount = useAccountsStore((s) => s.currentAccount);
  const {
    frens,
    setLoadingRecommendations,
    setRecommendations,
    loading,
    updatedAt,
  } = useRecommendationsStore(
    useSelect([
      "frens",
      "setLoadingRecommendations",
      "setRecommendations",
      "loading",
      "updatedAt",
    ])
  );
  const { themed } = useAppTheme();

  const openSignalList = useCallback(() => {
    Linking.openURL(
      "https://converseapp.notion.site/Converse-MM-signals-af014ca135c04ce1aae362e536712461?pvs=4"
    );
  }, []);

  const contactPol = useCallback(() => {
    navigation.popToTop();
    setTimeout(() => {
      navigation.navigate("Conversation", {
        peer: config.contactAddress,
      });
    }, 300);
  }, [navigation]);

  const [viewableItems, setViewableItems] = useState<{ [key: string]: true }>(
    {}
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems: items }: any) => {
      const viewable: { [key: string]: true } = {};
      items.forEach((item: any) => {
        viewable[item.item] = true;
      });
      setViewableItems(viewable);
    },
    []
  );

  useEffect(() => {
    // On load, let's load frens
    const getRecommendations = async () => {
      setLoadingRecommendations();
      await refreshRecommendationsForAccount(currentAccount);
    };
    const now = new Date().getTime();
    if (!loading && userAddress && now - updatedAt >= EXPIRE_AFTER) {
      getRecommendations();
    }
  }, [
    loading,
    setLoadingRecommendations,
    setRecommendations,
    userAddress,
    updatedAt,
    currentAccount,
  ]);

  const keyExtractor = useCallback((address: string) => address, []);

  const renderItem = useCallback(
    ({ item }: { item: string }) => {
      if (item === "title") {
        return (
          <>
            {visibility === "FULL" && showTitle && (
              <View style={themed($titleContainer)}>
                <>
                  <Text style={themed($emoji)}>👋</Text>
                  <Text style={themed($title)}>
                    {translate("recommendations.title")}
                  </Text>
                </>
              </View>
            )}
            {visibility === "EMBEDDED" && showTitle && (
              <View style={themed($sectionTitleContainer)}>
                <Text style={themed($sectionTitle)}>
                  {translate("recommendations.section_title")}
                </Text>
              </View>
            )}
          </>
        );
      }

      // If address is in groupMembers, remove profile from recommendations
      if (
        groupMembers?.some(
          (member) => member.address.toLowerCase() === item.toLowerCase()
        )
      ) {
        return null;
      }

      return (
        <Recommendation
          address={item}
          recommendationData={frens[item]}
          isVisible={!!viewableItems[item]}
          groupMode={groupMode}
          addToGroup={addToGroup}
        />
      );
    },
    [
      frens,
      themed,
      viewableItems,
      visibility,
      groupMembers,
      groupMode,
      addToGroup,
      showTitle,
    ]
  );

  if (visibility === "HIDDEN") return null;

  if (loading && Object.keys(frens).length === 0 && visibility === "FULL") {
    return (
      <View style={themed($fetching)}>
        <Loader />
        <Text style={themed($fetchingText)}>
          {translate("recommendations.loading")}
        </Text>
      </View>
    );
  }

  if (visibility === "FULL" && frens && Object.keys(frens).length === 0) {
    return (
      <>
        <Text style={themed($emoji)}>😐</Text>
        <Text style={themed($title)}>
          {translate("recommendations.no_recommendations")}
          <Text style={themed($clickableText)} onPress={openSignalList}>
            {translate("recommendations.signal_list")}
          </Text>
          {translate("recommendations.please_feel_free_to")}
          <Text style={themed($clickableText)} onPress={contactPol}>
            {translate("recommendations.contact_pol")}
          </Text>{" "}
          {translate("recommendations.if_you_want_us_to_add_anything")}
        </Text>
      </>
    );
  }

  return (
    <View style={themed($recommendations)}>
      <FlatList
        data={["title", ...Object.keys(frens)]}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 1,
          minimumViewTime: 0,
        }}
        onTouchStart={Keyboard.dismiss}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const $emoji: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginTop: spacing.xl,
  fontSize: 34,
  marginBottom: spacing.sm,
});

const $title: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text.primary,
  ...Platform.select({
    default: {
      fontSize: 17,
      paddingHorizontal: spacing.xl,
    },
    android: {
      fontSize: 14,
      paddingHorizontal: spacing.xxl,
    },
  }),
  textAlign: "center",
});

const $recommendations: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginBottom: spacing.xl,
  backgroundColor: colors.background.surface,
  marginLeft: Platform.OS === "android" ? spacing.md : 0,
});

const $fetching: ThemedStyle<ViewStyle> = () => ({
  flexGrow: 1,
  justifyContent: "center",
  marginBottom: 40,
});

const $fetchingText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text.primary,
  ...Platform.select({
    default: { fontSize: 17 },
    android: { fontSize: 16 },
  }),
  textAlign: "center",
  marginTop: spacing.lg,
});

const $clickableText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.text.action,
  fontWeight: "500",
});

const $noMatch: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xl,
});

const $titleContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  paddingBottom: spacing.xl,
  ...Platform.select({
    default: {
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border.subtle,
    },
    android: {},
    web: {},
  }),
});

const $sectionTitleContainer: ThemedStyle<ViewStyle> = ({
  colors,
  spacing,
}) => ({
  ...Platform.select({
    default: {
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border.subtle,
      paddingLeft: spacing.md,
    },
    android: {},
    web: {},
  }),
});

const $sectionTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.text.secondary,
  ...Platform.select({
    default: {
      fontSize: 12,
      marginBottom: spacing.xs,
      marginTop: spacing.lg,
    },
    android: {
      fontSize: 11,
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    },
  }),
});
