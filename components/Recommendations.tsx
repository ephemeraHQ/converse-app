import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  ColorSchemeName,
  Platform,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import IconLoading from "../assets/icon-loading.png";
import { Frens, RecommendationData, findFrens } from "../utils/api";
import {
  backgroundColor,
  itemSeparatorColor,
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
            <Image
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
          variant="secondary"
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
  return (
    <View style={[styles.recommendations, { marginBottom: insets.bottom }]}>
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
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    recommendations: {
      backgroundColor: backgroundColor(colorScheme),
      borderTopWidth: 0.5,
      borderTopColor: itemSeparatorColor(colorScheme),
      marginLeft: 16,
    },
    recommendation: {
      flexDirection: "row",
      paddingRight: 10,
      paddingVertical: 15,
      borderBottomWidth: 0.5,
      borderBottomColor: itemSeparatorColor(colorScheme),
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
      marginBottom: 200,
      marginTop: 200,
    },
    fetchingText: {
      fontSize: 17,
      textAlign: "center",
      marginTop: 20,
    },
  });
