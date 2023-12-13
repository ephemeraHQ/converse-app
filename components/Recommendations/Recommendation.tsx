import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Image,
  useColorScheme,
} from "react-native";

import IconLoading from "../../assets/icon-loading.png";
import { RecommendationData } from "../../data/store/recommendationsStore";
import {
  itemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../../utils/colors";
import { shortAddress } from "../../utils/str";
import { NavigationChatButton } from "../Chat/ChatActionButton";

export function Recommendation({
  address,
  recommendationData: { ens, farcasterUsernames, lensHandles, tags },
  navigation,
  embedInChat,
  isVisible,
}: {
  address: string;
  recommendationData: RecommendationData;
  navigation?: NativeStackNavigationProp<any>;
  embedInChat?: boolean;
  isVisible: boolean;
}) {
  const styles = useStyles();
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
            <Image
              source={isVisible ? { uri: t.image } : IconLoading}
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
          <NavigationChatButton navigation={navigation} address={address} />
        </View>
      )}
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    recommendation: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
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
      flex: 1,
      justifyContent: "center",
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
    recommendationRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 3,
    },
    recommendationImage: {
      width: 15,
      height: 15,
      marginRight: 10,
    },
  });
};
