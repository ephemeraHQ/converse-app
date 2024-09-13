import ConverseButton from "@components/Button/Button";
import { translate } from "@i18n/index";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
  tertiaryBackgroundColor,
  itemSeparatorColor,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
import Recommendations from "../Recommendations/Recommendations";

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
  const setRecommendations = useRecommendationsStore(
    (s) => s.setRecommendations
  );
  const hasRecommendations = Object.keys(frens).length > 0;

  return (
    <View style={styles.container}>
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
          <Text style={styles.title}>
            {hasRecommendations
              ? translate("connectWithYourNetwork")
              : translate("shareYourQRCode")}
          </Text>
          <Text style={styles.subtitle}>
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

      <View style={styles.chin}>
        <View style={styles.chinContent}>
          <Text style={styles.chinTitle}>{translate("betaTestTitle")}</Text>
          <Text style={styles.chinDescription}>
            {translate("betaTestDescription")}
          </Text>

          <ConverseButton
            title={translate("joinBetaGroup")}
            variant="primary"
            style={styles.betaGroupButton}
            textStyle={styles.betaGroupButtonText}
            onPress={() => {
              Linking.openURL(config.betaGroupChatUrl);
            }}
          />
        </View>
      </View>
    </View>
  );
};

const useStyles = () => {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
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
      paddingTop: Paddings.large,
    },
    titlesContainer: {
      width: "100%",
      borderBottomColor: tertiaryBackgroundColor(colorScheme),
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      marginBottom: Margins.small,
      color: textPrimaryColor(colorScheme),
      textAlign: "center",
    },
    subtitle: {
      fontSize: 16,
      textAlign: "center",
      marginBottom: Margins.large,
      color: textSecondaryColor(colorScheme),
    },
    qrCodeContainer: {
      padding: Paddings.large,
      backgroundColor: backgroundColor(colorScheme),
      borderRadius: BorderRadius.large,
      shadowColor: textSecondaryColor(colorScheme),
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      marginTop: Platform.OS === "android" ? Margins.large : 0,
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
    chin: {
      borderTopWidth: 1,
      borderTopColor: tertiaryBackgroundColor(colorScheme),
      backgroundColor: backgroundColor(colorScheme),
      paddingBottom: insets.bottom + 24,
    },
    chinContent: {
      alignItems: "center",
      paddingHorizontal: Paddings.large,
    },
    chinTitle: {
      color: textPrimaryColor(colorScheme),
      fontSize: 15,
      fontWeight: "600",
      textAlign: "center",
      marginTop: Margins.default,
      marginBottom: Margins.small,
    },
    chinDescription: {
      color: textSecondaryColor(colorScheme),
      fontSize: 14,
      textAlign: "center",
      marginBottom: Margins.default,
    },
    betaGroupButton: {
      maxWidth: Platform.OS === "web" ? 300 : undefined,
      borderRadius: 16,
      marginHorizontal: 24,
    },
    betaGroupButtonText: {},
  });
};

export default ChatNullState;
