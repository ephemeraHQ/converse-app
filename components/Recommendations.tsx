import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { useCallback, useContext, useEffect } from "react";
import {
  ColorSchemeName,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import FastImage from "react-native-fast-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import IconLoading from "../assets/icon-loading.png";
import config from "../config";
import { AppContext } from "../data/deprecatedStore/context";
import { RecommendationsDispatchTypes } from "../data/deprecatedStore/recommendationsReducer";
import { RecommendationData, findFrens } from "../utils/api";
import {
  backgroundColor,
  itemSeparatorColor,
  primaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import { shortAddress } from "../utils/str";
import ActivityIndicator from "./ActivityIndicator/ActivityIndicator";
import Button from "./Button/Button";

const EXPIRE_AFTER = 86400000; // 1 DAY

export function Recommendation({
  address,
  recommendationData: { ens, farcasterUsernames, lensHandles, tags },
  navigation,
  embedInChat,
}: {
  address: string;
  recommendationData: RecommendationData;
  navigation?: NativeStackNavigationProp<any>;
  embedInChat?: boolean;
}) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const socials = [
    ...lensHandles,
    ...farcasterUsernames.map((f) => `${f} on farcaster`),
  ];

  const textAlign = embedInChat ? "center" : "left";

  return (
    <View
      key={address}
      style={[
        styles.recommendation,
        embedInChat
          ? { marginHorizontal: 40, paddingRight: 0 }
          : styles.recommendationBorderBottom,
      ]}
    >
      <View style={styles.recommendationLeft}>
        <Text style={[styles.recommendationTitle, { textAlign }]}>
          {ens || shortAddress(address)}
        </Text>

        {socials.length > 0 && (
          <Text
            style={[
              styles.recommendationText,
              { textAlign, width: embedInChat ? "100%" : undefined },
            ]}
          >
            {socials.join(" | ")}
          </Text>
        )}
        {tags.map((t) => (
          <View
            key={t.text}
            style={[
              styles.recommendationRow,
              embedInChat
                ? { alignSelf: "center", alignItems: "flex-start" }
                : { alignItems: "center" },
            ]}
          >
            <FastImage
              source={{ uri: t.image }}
              defaultSource={IconLoading}
              style={[
                styles.recommendationImage,
                embedInChat ? { top: 2 } : {},
              ]}
            />
            <Text style={[styles.recommendationText, { textAlign }]}>
              {t.text}
            </Text>
          </View>
        ))}
      </View>
      {!embedInChat && navigation && (
        <View style={styles.recommendationRight}>
          <Button
            variant={Platform.OS === "android" ? "text" : "secondary"}
            picto="message"
            title="Chat"
            style={styles.cta}
            onPress={() => {
              navigation.popToTop();
              setTimeout(() => {
                navigation.navigate("Conversation", {
                  mainConversationWithPeer: address,
                  focus: true,
                });
              }, 300);
            }}
          />
        </View>
      )}
    </View>
  );
}

export default function Recommendations({
  navigation,
  visibility,
}: {
  navigation: NativeStackNavigationProp<any>;
  visibility: "FULL" | "EMBEDDED" | "HIDDEN";
}) {
  const { state, dispatch } = useContext(AppContext);
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colorScheme);

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

  useEffect(() => {
    // On load, let's load frens
    const getRecommendations = async () => {
      dispatch({
        type: RecommendationsDispatchTypes.SetLoadingRecommendations,
      });
      const frens = await findFrens();
      const now = new Date().getTime();

      dispatch({
        type: RecommendationsDispatchTypes.SetRecommendations,
        payload: { frens, updatedAt: now },
      });
    };
    const now = new Date().getTime();
    if (
      !state.recommendations.loading &&
      state.xmtp.address &&
      now - state.recommendations.updatedAt >= EXPIRE_AFTER
    ) {
      getRecommendations();
    }
  }, [dispatch, state.recommendations, state.xmtp.address]);
  const frens = state.recommendations.frens;

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
              { marginBottom: insets.bottom + 25, marginTop: 30 },
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
    ]
  );

  if (visibility === "HIDDEN") return null;

  if (
    state.recommendations.loading &&
    Object.keys(frens).length === 0 &&
    visibility === "FULL"
  ) {
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
      />
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
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
    recommendation: {
      flexDirection: "row",
      paddingRight: 10,
      ...Platform.select({
        default: {
          paddingVertical: 15,
        },
        android: { paddingVertical: 12 },
      }),
    },
    recommendationBorderBottom: {
      ...Platform.select({
        default: {
          borderBottomWidth: 0.5,
          borderBottomColor: itemSeparatorColor(colorScheme),
        },
        android: {},
      }),
    },
    recommendationLeft: {
      flexGrow: 1,
      flexShrink: 1,
    },
    recommendationRight: {
      justifyContent: "center",
    },
    recommendationTitle: {
      width: "100%",
      color: textPrimaryColor(colorScheme),
      ...Platform.select({
        default: {
          fontSize: 17,
          fontWeight: "600",
          marginBottom: 3,
          marginRight: 110,
        },
        android: {
          fontSize: 16,
        },
      }),
    },
    recommendationRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 3,
    },
    recommendationText: {
      color: textSecondaryColor(colorScheme),
      ...Platform.select({
        default: {
          fontSize: 15,
        },
        android: {
          fontSize: 14,
        },
      }),
      alignSelf: "flex-start",
    },
    recommendationImage: {
      width: 15,
      height: 15,
      marginRight: 10,
    },
    cta: {
      marginRight: 0,
      marginLeft: "auto",
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
