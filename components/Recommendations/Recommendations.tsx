import { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import config from "../../config";
import {
  useAccountsStore,
  useCurrentAccount,
  useRecommendationsStore,
} from "../../data/store/accountsStore";
import { useSelect } from "../../data/store/storeHelpers";
import { findFrens } from "../../utils/api";
import {
  backgroundColor,
  itemSeparatorColor,
  primaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import ActivityIndicator from "../ActivityIndicator/ActivityIndicator";
import { Recommendation } from "./Recommendation";

const EXPIRE_AFTER = 86400000; // 1 DAY

export default function Recommendations({
  navigation,
  visibility,
}: {
  navigation: NativeStackNavigationProp<any>;
  visibility: "FULL" | "EMBEDDED" | "HIDDEN";
}) {
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
  const insets = useSafeAreaInsets();
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
        mainConversationWithPeer: config.polAddress,
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
      const frens = await findFrens(currentAccount);
      const now = new Date().getTime();
      setRecommendations(frens, now);
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
            {visibility === "FULL" && (
              <View style={styles.titleContainer}>
                <Text style={styles.emoji}>👋</Text>
                <Text style={styles.title}>
                  Find people who have interests in common with you. Start
                  talking to them.
                </Text>
              </View>
            )}
            {visibility === "EMBEDDED" && (
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>RECOMMENDED PROFILES</Text>
              </View>
            )}
          </>
        );
      } else if (item === "signals") {
        return (
          <Text
            style={[
              styles.title,
              { marginBottom: insets.bottom + 40, marginTop: 30 },
            ]}
          >
            We’re adding matching signals very often.{" "}
            <Text style={styles.clickableText} onPress={openSignalList}>
              Here is the current list
            </Text>
            ,{" "}
            <Text style={styles.clickableText} onPress={contactPol}>
              contact our cofounder Pol
            </Text>{" "}
            if you want us to add anything.
          </Text>
        );
      }
      return (
        <Recommendation
          address={item}
          recommendationData={frens[item]}
          navigation={navigation}
          isVisible={!!viewableItems[item]}
        />
      );
    },
    [
      contactPol,
      frens,
      insets.bottom,
      navigation,
      openSignalList,
      styles.clickableText,
      styles.emoji,
      styles.sectionTitle,
      styles.sectionTitleContainer,
      styles.title,
      styles.titleContainer,
      visibility,
      viewableItems,
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
        data={["title", ...Object.keys(frens), "signals"]}
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
      marginLeft: 16,
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
      }),
    },
    sectionTitleContainer: {
      ...Platform.select({
        default: {
          borderBottomWidth: 0.5,
          borderBottomColor: itemSeparatorColor(colorScheme),
        },
        android: {},
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
