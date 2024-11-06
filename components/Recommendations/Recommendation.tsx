import { ProfileSocials } from "@data/store/profilesStore";
import {
  itemSeparatorColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

import IconLoading from "@assets/icon-loading.png";
import { RecommendationData } from "@data/store/recommendationsStore";
import {
  getPreferredAvatar,
  getPreferredName,
  getPrimaryNames,
} from "@utils/profile";
import { shortAddress } from "@utils/strings/shortAddress";
import Avatar from "../Avatar";
import { NavigationChatButton } from "@search/components/NavigationChatButton";

export function Recommendation({
  address,
  // @todo => use only profile
  recommendationData: { ens, farcasterUsernames, lensHandles, tags, profile },
  embedInChat,
  isVisible,
  socials,
  groupMode,
  addToGroup,
}: {
  address: string;
  recommendationData: RecommendationData;
  embedInChat?: boolean;
  isVisible: boolean;
  socials?: ProfileSocials;
  groupMode?: boolean;
  addToGroup?: (member: ProfileSocials & { address: string }) => void;
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
          size={AvatarSizes.listItemDisplay}
          style={styles.avatar}
          name={preferredName}
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
      {!embedInChat && (
        <View style={styles.recommendationRight}>
          <NavigationChatButton
            address={address}
            groupMode={groupMode}
            addToGroup={
              addToGroup ? () => addToGroup({ ...socials, address }) : undefined
            }
          />
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
          paddingLeft: Platform.OS === "android" ? 0 : 16,
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
