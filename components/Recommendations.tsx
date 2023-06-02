import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { useCallback, useEffect, useState } from "react";
import {
  ColorSchemeName,
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
import { Frens, RecommendationData, findFrens } from "../utils/api";
import {
  backgroundColor,
  itemSeparatorColor,
  primaryColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import mmkv from "../utils/mmkv";
import { shortAddress } from "../utils/str";
import ActivityIndicator from "./ActivityIndicator/ActivityIndicator";
import Button from "./Button/Button";

const EXPIRE_AFTER = 86400000; // 1 DAY

function Recommendation({
  address,
  recommendationData: { ens, farcasterUsernames, lensHandles, tags },
  navigation,
}: {
  address: string;
  recommendationData: RecommendationData;
  navigation: NativeStackNavigationProp<any>;
}) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const socials = [
    ...lensHandles,
    ...farcasterUsernames.map((f) => `${f} on farcaster`),
  ];

  return (
    <View key={address} style={styles.recommendation}>
      <View style={styles.recommendationLeft}>
        <Text style={styles.recommendationTitle}>
          {ens || shortAddress(address)}
        </Text>
        {socials.length > 0 && (
          <Text style={styles.recommendationText}>{socials.join(" | ")}</Text>
        )}
        {tags.map((t) => (
          <View key={t.text} style={styles.recommendationRow}>
            <FastImage
              source={{ uri: t.image }}
              defaultSource={IconLoading}
              style={styles.recommendationImage}
            />
            <Text style={styles.recommendationText}>{t.text}</Text>
          </View>
        ))}
      </View>
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
    </View>
  );
}

export default function Recommendations({
  navigation,
}: {
  navigation: NativeStackNavigationProp<any>;
}) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const styles = getStyles(colorScheme);
  const [fetching, setFetching] = useState(false);
  const [frens, setFrens] = useState<Frens | undefined>(undefined);

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
      const now = new Date().getTime();
      const existingRecommendations = mmkv.getString(
        "converse-recommendations"
      );
      if (existingRecommendations) {
        try {
          const parsedRecommendations = JSON.parse(existingRecommendations);
          if (now - parsedRecommendations.fetchedAt < EXPIRE_AFTER) {
            setFrens(parsedRecommendations.frens);
            return;
          }
        } catch (e) {
          console.log(e);
        }
      }
      setFetching(true);
      const frens = await findFrens();
      mmkv.set(
        "converse-recommendations",
        JSON.stringify({
          fetchedAt: new Date().getTime(),
          frens,
        })
      );
      setFrens(frens);
      setFetching(false);
    };
    getRecommendations();
  }, []);

  if (fetching) {
    return (
      <View style={styles.fetching}>
        <ActivityIndicator />
        <Text style={styles.fetchingText}>Loading your recommendations</Text>
      </View>
    );
  }
  if (frens && Object.keys(frens).length === 0) {
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
    <View style={{ marginBottom: insets.bottom }}>
      <Text style={styles.emoji}>👋</Text>
      <Text style={styles.title}>
        Find people who have interests in common with you. Start talking to
        them.
      </Text>
      <View style={styles.recommendations}>
        {frens &&
          Object.keys(frens).map((address) => (
            <Recommendation
              key={address}
              address={address}
              recommendationData={frens[address]}
              navigation={navigation}
            />
          ))}
      </View>
      <Text style={styles.title}>
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
      marginVertical: 30,
      backgroundColor: backgroundColor(colorScheme),
      ...Platform.select({
        default: {
          borderTopWidth: 0.5,
          borderTopColor: itemSeparatorColor(colorScheme),
        },
        android: {},
      }),

      marginLeft: 16,
    },
    recommendation: {
      flexDirection: "row",
      paddingRight: 10,
      ...Platform.select({
        default: {
          paddingVertical: 15,
          borderBottomWidth: 0.5,
          borderBottomColor: itemSeparatorColor(colorScheme),
        },
        android: { paddingVertical: 12 },
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
      flex: 1,
      ...Platform.select({
        default: {
          fontSize: 15,
        },
        android: {
          fontSize: 14,
        },
      }),
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
  });
