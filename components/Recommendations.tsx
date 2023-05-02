import { ReactNode, useEffect, useState } from "react";
import {
  ColorSchemeName,
  Platform,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";

import {
  Frens,
  RecommendationData,
  RecommentationTag,
  findFrens,
} from "../utils/api";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
import mmkv from "../utils/mmkv";
import { shortAddress } from "../utils/str";

const EXPIRE_AFTER = 86400000; // 1 DAY

function Recommendation({
  address,
  recommendationData: { ens, farcasterUsernames, lensHandles, tags },
}: {
  address: string;
  recommendationData: RecommendationData;
}) {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const socials = [
    ...lensHandles,
    ...farcasterUsernames.map((f) => `${f} on farcaster`),
  ];

  const tagsRender: ReactNode[] = [];
  tags.forEach((t) => {
    let text = "";
    switch (t.tag) {
      case RecommentationTag.FOLLOW_EACH_OTHER_ON_LENS: {
        text = "Lens mutual follow";
        break;
      }

      case RecommentationTag.FOLLOW_EACH_OTHER_ON_WARPCAST: {
        text = "Farcaster mutual follow";
        break;
      }

      case RecommentationTag.SHARED_TRANSACTION: {
        text = "Transacted with you";
        break;
      }

      case RecommentationTag.SHARED_NFT_COLLECTION: {
        text = `${t.params?.collectionName} holder`;
        break;
      }

      default:
        break;
    }
    tagsRender.push(
      <View key={t.tag}>
        <Text style={styles.recommendationTag}>{text}</Text>
      </View>
    );
  });

  return (
    <View key={address} style={styles.recommendation}>
      <Text style={styles.recommendationTitle}>
        {ens || shortAddress(address)}
      </Text>
      {socials.length > 0 && (
        <Text style={styles.recommendationTag}>{socials.join(" | ")}</Text>
      )}
      {tagsRender}
    </View>
  );
}

export default function Recommendations() {
  const colorScheme = useColorScheme();
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
  console.log("frens are", frens, "loading", fetching ? "yes" : "no");
  return (
    <View style={styles.recommendations}>
      {frens &&
        Object.keys(frens).map((address) => (
          <Recommendation
            address={address}
            recommendationData={frens[address]}
          />
        ))}
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    recommendations: {
      backgroundColor: backgroundColor(colorScheme),
      borderWidth: 1,
    },
    recommendation: {
      borderWidth: 1,
      borderColor: "red",
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
    recommendationTag: {
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
  });
