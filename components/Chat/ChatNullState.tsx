import AnimatedBanner from "@components/Banner/AnimatedBanner";
import Recommendations from "@components/Recommendations/Recommendations";
import { useSettingsStore } from "@data/store/accountsStore";
import { translate } from "@i18n/index";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
  tertiaryBackgroundColor,
  itemSeparatorColor,
  primaryColor,
} from "@styles/colors";
import { BorderRadius, Paddings, Margins } from "@styles/sizes";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  Platform,
  Linking,
} from "react-native";

import config from "../../config";
import {
  useProfilesStore,
  useRecommendationsStore,
} from "../../data/store/accountsStore";
import { ShareProfileContent } from "../../screens/ShareProfile";
import {
  getPreferredUsername,
  getPreferredName,
  getPreferredAvatar,
} from "../../utils/profile";

interface ChatNullStateProps {
  currentAccount: string;
  navigation: any;
}

const ChatNullState: React.FC<ChatNullStateProps> = ({
  currentAccount,
  navigation,
}) => {
  const colorScheme = useColorScheme();
  const styles = useStyles();

  const socials = useProfilesStore((s) => s.profiles[currentAccount]?.socials);
  const username = getPreferredUsername(socials);
  const displayName = getPreferredName(socials, currentAccount);
  const profileUrl = `https://${config.websiteDomain}/dm/${
    username || currentAccount
  }`;
  const avatar = getPreferredAvatar(socials);

  const frens = useRecommendationsStore((s) => s.frens);
  const hasRecommendations = Object.keys(frens).length > 0;

  const hasUserDismissedBanner = useSettingsStore(
    (s) => s.hasUserDismissedBanner
  );
  const setHasUserDismissedBanner = useSettingsStore(
    (s) => s.setHasUserDismissedBanner
  );

  return (
    <View style={styles.container}>
      {!hasUserDismissedBanner && (
        <AnimatedBanner
          title={translate("alphaTestTitle")}
          description={translate("alphaTestDescription")}
          cta={translate("joinAlphaGroup")}
          style={{ marginBottom: 0 }}
          onButtonPress={() => {
            Linking.openURL(config.alphaGroupChatUrl);
          }}
        />
      )}

      <View style={styles.contentContainer}>
        <View
          style={[
            styles.titlesContainer,
            {
              borderBottomWidth: hasRecommendations ? 0.5 : 0,
              borderBottomColor: itemSeparatorColor(colorScheme),
            },
          ]}
        >
          <Text
            style={[
              styles.title,
              hasRecommendations ? styles.titleWithRecommendations : {},
            ]}
          >
            {hasRecommendations
              ? translate("connectWithYourNetwork")
              : translate("shareYourQRCode")}
          </Text>
          <Text
            style={[
              styles.description,
              hasRecommendations ? styles.descriptionWithRecommendations : {},
            ]}
          >
            {hasRecommendations
              ? translate("findContacts")
              : translate("moveOrConnect")}
          </Text>
        </View>
        {hasRecommendations ? (
          <View style={styles.recommendationsContainer}>
            <Recommendations
              navigation={navigation}
              visibility="EMBEDDED"
              showTitle={false}
            />
          </View>
        ) : (
          <View style={styles.qrCodeContainer}>
            <ShareProfileContent
              compact
              userAddress={currentAccount}
              username={username}
              displayName={displayName}
              avatar={avatar || ""}
              profileUrl={profileUrl}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
      borderTopWidth: Platform.OS === "android" ? 0 : 1,
      borderTopColor: tertiaryBackgroundColor(colorScheme),
    },
    contentContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-start",
      paddingTop: Paddings.default,
    },
    titlesContainer: {
      width: "100%",
      borderBottomColor: tertiaryBackgroundColor(colorScheme),
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: Margins.small,
      color: textPrimaryColor(colorScheme),
      textAlign: "center",
      letterSpacing: -0.4,
      marginTop: Margins.small,
    },
    titleWithRecommendations: {
      textAlign: "left",
      marginLeft: Margins.default,
      marginTop: 0,
    },
    description: {
      fontSize: 14,
      textAlign: "center",
      marginBottom: Margins.large,
      color: textPrimaryColor(colorScheme),
      letterSpacing: -0.3,
    },
    descriptionWithRecommendations: {
      textAlign: "left",
      marginLeft: Margins.default,
    },
    qrCodeContainer: {
      paddingVertical: Paddings.default,
      paddingHorizontal: Paddings.large,
      backgroundColor: backgroundColor(colorScheme),
      borderRadius: BorderRadius.large,
      shadowColor: primaryColor(colorScheme),
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
      marginTop: Platform.OS === "android" ? Margins.large : Margins.small,
    },
    identityContainer: {
      marginTop: Margins.large,
      alignItems: "center",
    },
    identity: {
      color: textPrimaryColor(colorScheme),
      fontSize: 24,
      fontWeight: "600",
      textAlign: "center",
    },
    username: {
      fontSize: 16,
      color: textSecondaryColor(colorScheme),
      marginTop: Margins.small,
    },
    recommendationsContainer: {
      width: "100%",
      height: "100%",
    },
  });
};

export default ChatNullState;
