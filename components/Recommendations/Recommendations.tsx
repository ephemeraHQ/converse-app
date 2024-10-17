import { ProfileByAddress, ProfileSocials } from "@data/store/profilesStore";
import {
  backgroundColor,
  itemSeparatorColor,
  primaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { getProfile } from "@utils/profile";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";

import { Recommendation } from "./Recommendation";
import config from "../../config";
import {
  useAccountsStore,
  useCurrentAccount,
  useRecommendationsStore,
} from "../../data/store/accountsStore";
import { useSelect } from "../../data/store/storeHelpers";
import { useRouter } from "../../navigation/useNavigation";
import { refreshRecommendationsForAccount } from "../../utils/recommendations";
import ActivityIndicator from "../ActivityIndicator/ActivityIndicator";

const EXPIRE_AFTER = 86400000; // 1 DAY

export default function Recommendations({
  visibility,
  profiles,
  groupMode,
  groupMembers,
  addToGroup,
  showTitle = true,
}: {
  visibility: "FULL" | "EMBEDDED" | "HIDDEN";
  profiles?: ProfileByAddress;
  groupMode?: boolean;
  groupMembers?: (ProfileSocials & { address: string })[];
  addToGroup?: (member: ProfileSocials & { address: string }) => void;
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
  const styles = useStyles();

  const openSignalList = useCallback(() => {
    Linking.openURL(
      "https://converseapp.notion.site/Converse-MM-signals-af014ca135c04ce1aae362e536712461?pvs=4"
    );
  }, []);
  const contactPol = useCallback(() => {
    navigation.popToTop();
    setTimeout(() => {
      navigation.navigate("Conversation", {
        mainConversationWithPeer: config.contactAddress,
        focus: true,
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
              <View style={styles.titleContainer}>
                <>
                  <Text style={styles.emoji}>👋</Text>
                  <Text style={styles.title}>
                    Find people who have interests in common with you. Start
                    talking to them.
                  </Text>
                </>
              </View>
            )}
            {visibility === "EMBEDDED" && showTitle && (
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>RECOMMENDED PROFILES</Text>
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
          socials={getProfile(item, profiles)?.socials}
          groupMode={groupMode}
          addToGroup={addToGroup}
        />
      );
    },
    [
      frens,
      styles.emoji,
      styles.sectionTitle,
      styles.sectionTitleContainer,
      styles.title,
      styles.titleContainer,
      viewableItems,
      visibility,
      profiles,
      groupMembers,
      groupMode,
      addToGroup,
      showTitle,
    ]
  );

  if (visibility === "HIDDEN") return null;

  if (loading && Object.keys(frens).length === 0 && visibility === "FULL") {
    return (
      <View style={styles.fetching}>
        <ActivityIndicator />
        <Text style={styles.fetchingText}>Loading your recommendations</Text>
      </View>
    );
  }

  if (visibility === "FULL" && frens && Object.keys(frens).length === 0) {
    return (
      <>
        <Text style={styles.emoji}>😐</Text>
        <Text style={styles.title}>
          We did not find people to match you with. We’re still early and we’re
          not using that many signals. You can{" "}
          <Text style={styles.clickableText} onPress={openSignalList}>
            find the current list here
          </Text>
          , please feel free to{" "}
          <Text style={styles.clickableText} onPress={contactPol}>
            contact our co-founder Pol
          </Text>{" "}
          if you want us to add anything.{"\n\n"}Thank you!
        </Text>
      </>
    );
  }

  return (
    <View style={styles.recommendations}>
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
      />
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    emoji: {
      textAlign: "center",
      marginTop: 30,
      fontSize: 34,
      marginBottom: 12,
    },
    title: {
      color: textPrimaryColor(colorScheme),
      ...Platform.select({
        default: {
          fontSize: 17,
          paddingHorizontal: 32,
        },
        android: {
          fontSize: 14,
          paddingHorizontal: 39,
        },
      }),

      textAlign: "center",
    },
    recommendations: {
      marginBottom: 30,
      backgroundColor: backgroundColor(colorScheme),
      marginLeft: Platform.OS === "android" ? 16 : 0,
    },
    fetching: {
      flexGrow: 1,
      justifyContent: "center",
      marginBottom: 40,
    },
    fetchingText: {
      color: textPrimaryColor(colorScheme),
      ...Platform.select({
        default: { fontSize: 17 },
        android: { fontSize: 16 },
      }),

      textAlign: "center",
      marginTop: 20,
    },
    clickableText: {
      color: primaryColor(colorScheme),
      fontWeight: "500",
    },
    noMatch: {
      marginTop: 30,
    },
    titleContainer: {
      paddingBottom: 30,
      ...Platform.select({
        default: {
          borderBottomWidth: 0.5,
          borderBottomColor: itemSeparatorColor(colorScheme),
        },
        android: {},
        web: {},
      }),
    },
    sectionTitleContainer: {
      ...Platform.select({
        default: {
          borderBottomWidth: 0.5,
          borderBottomColor: itemSeparatorColor(colorScheme),
          paddingLeft: 16,
        },
        android: {},
        web: {},
      }),
    },
    sectionTitle: {
      color: textSecondaryColor(colorScheme),
      ...Platform.select({
        default: {
          fontSize: 12,
          marginBottom: 8,
          marginTop: 23,
        },
        android: {
          fontSize: 11,
          marginBottom: 12,
          marginTop: 16,
        },
      }),
    },
  });
};
