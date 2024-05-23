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
import {
  getPreferredAvatar,
  getPreferredName,
  getPrimaryNames,
} from "../../utils/profile";
import { shortAddress } from "../../utils/str";
import Avatar from "../Avatar";
import { NavigationChatButton } from "../Search/NavigationChatButton";

export function Recommendation({
  address,
  // @todo => use only profile
  recommendationData: { ens, farcasterUsernames, lensHandles, tags, profile },
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
  let primaryNamesDisplay = [
    ...(lensHandles || []).map((l) => `${l} on lens`),
    ...(farcasterUsernames || []).map((f) => `${f} on farcaster`),
  ];
  const preferredName = profile // @todo => use only preferred name
    ? getPreferredName(profile, address)
    : ens || shortAddress(address);
  if (profile) {
    const primaryNames = getPrimaryNames(profile);
    primaryNamesDisplay = [
      ...primaryNames.filter((name) => name !== preferredName),
      shortAddress(address),
    ];
  }
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
      {!embedInChat && (
        <Avatar
          uri={getPreferredAvatar(profile)}
          size={40}
          style={styles.avatar}
        />
      )}
      <View style={styles.recommendationLeft}>
        <Text style={[styles.recommendationTitle, { textAlign }]}>
          {preferredName}
        </Text>

        {primaryNamesDisplay.length > 0 && (
          <Text
            style={[
              styles.recommendationText,
              { textAlign, width: embedInChat ? "100%" : undefined },
            ]}
            numberOfLines={embedInChat ? undefined : 1}
          >
            {primaryNamesDisplay.join(" | ")}
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
    avatar: {
      marginRight: Platform.OS === "ios" ? 13 : 16,
    },
    recommendationLeft: {
      flexGrow: 1,
      flexShrink: 1,
      justifyContent: "center",
    },
    recommendationRight: {
      marginLeft: Platform.OS === "ios" ? 10 : 0,
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
          flexGrow: 1,
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
