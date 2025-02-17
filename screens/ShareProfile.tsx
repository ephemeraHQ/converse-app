import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import { AvatarSizes } from "@styles/sizes";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import { useAppTheme } from "@theme/useAppTheme";
import { shortAddress } from "@utils/strings/shortAddress";
import AndroidBackAction from "../components/AndroidBackAction";
import { Avatar } from "../components/Avatar";
import Button from "../components/Button/Button";
import ActionButton from "../components/Chat/ActionButton";
import Picto from "../components/Picto/Picto";
import { Screen } from "../components/Screen/ScreenComp/Screen";
import { config } from "../config";
import { useCurrentAccount } from "../features/multi-inbox/multi-inbox.store";
import { NavigationParamList } from "./Navigation/Navigation";
import { useInboxAvatar } from "@/hooks/useInboxAvatar";
import { useInboxName } from "@/hooks/useInboxName";
import { translate } from "@/i18n";

const ShareProfileContent = ({
  userAddress,
  username,
  displayName,
  avatar,
  profileUrl,
  compact = false,
}: {
  userAddress: string;
  username?: string;
  displayName: string;
  avatar: string;
  profileUrl: string;
  compact?: boolean;
}) => {
  const colorScheme = useColorScheme();
  const styles = useStyles();
  const [copiedLink, setCopiedLink] = useState(false);

  const headerHeight = useHeaderHeight();

  const shareDict =
    Platform.OS === "ios" ? { url: profileUrl } : { message: profileUrl };

  const shareButtonText = copiedLink
    ? translate("share_profile.link_copied")
    : translate("share_profile.copy_link");

  const handleShare = () => {
    Share.share(shareDict);
  };

  return (
    <>
      <View style={compact ? styles.shareProfileCompact : styles.shareProfile}>
        <View style={styles.shareProfileContent}>
          <Avatar
            uri={avatar}
            name={displayName}
            size={
              compact
                ? AvatarSizes.shareProfileCompact
                : AvatarSizes.shareProfile
            }
            style={styles.avatar}
          />
          <Text style={[styles.identity, compact && styles.identityCompact]}>
            {displayName || username || shortAddress(userAddress || "")}
          </Text>
          {displayName !== username && (
            <Text style={styles.username}>
              {username || shortAddress(userAddress || "")}
            </Text>
          )}
        </View>
        <View style={[styles.qrCode, compact && styles.qrCodeCompact]}>
          <QRCode
            size={compact ? 200 : 220}
            value={profileUrl}
            backgroundColor={backgroundColor(colorScheme)}
            color={textPrimaryColor(colorScheme)}
          />
        </View>
        <View
          style={[
            styles.shareButtonContainer,
            compact && styles.shareButtonContainerCompact,
          ]}
        >
          {!compact ? (
            <Button
              style={{
                width: "100%",
              }}
              title={shareButtonText}
              picto={copiedLink ? "checkmark" : "doc.on.doc"}
              onPress={handleShare}
            />
          ) : (
            <TouchableOpacity
              onPress={handleShare}
              style={styles.shareButtonCompact}
            >
              <Picto
                picto="square.and.arrow.up"
                style={styles.shareButtonIconCompact}
                size={Platform.OS === "android" ? 16 : 12}
              />
              <Text style={styles.shareButtonTextCompact}>
                {shareButtonText}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {!compact && <View style={{ height: headerHeight }} />}
      </View>
    </>
  );
};

export { ShareProfileContent };

export default function ShareProfileScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "ShareProfile">) {
  const userAddress = useCurrentAccount() as string;
  const username = useInboxName(userAddress);
  const displayName = useInboxName(userAddress);
  const avatar = useInboxAvatar(userAddress);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        Platform.OS === "ios" && (
          <TouchableOpacity
            onPress={() => {
              navigation.goBack();
            }}
          >
            <ActionButton
              picto="xmark"
              style={{ width: 30, height: 30, marginTop: 10 }}
            />
          </TouchableOpacity>
        ),
      headerLeft: () =>
        Platform.OS !== "ios" && <AndroidBackAction navigation={navigation} />,
    });
  }, [navigation]);

  const profileUrl = `https://${config.websiteDomain}/dm/${
    username || userAddress
  }`;

  return (
    <Screen safeAreaEdges={["bottom"]} contentContainerStyle={{ flex: 1 }}>
      <ShareProfileContent
        userAddress={userAddress}
        username={username}
        displayName={displayName}
        avatar={avatar || ""}
        profileUrl={profileUrl}
      />
    </Screen>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  const { theme } = useAppTheme();

  return StyleSheet.create({
    shareProfile: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
    shareProfileCompact: {
      flex: 0,
    },
    shareProfileContent: {
      alignItems: "center",
    },
    avatar: {
      alignSelf: "center",
    },
    qrCode: {
      alignSelf: "center",
      justifyContent: "center",
      marginTop: 40,
    },
    qrCodeCompact: {
      marginTop: 20,
    },
    identity: {
      color: textPrimaryColor(colorScheme),
      fontSize: 25,
      fontWeight: "600",
      textAlign: "center",
      marginTop: 8,
    },
    identityCompact: {
      fontSize: 20,
    },
    username: {
      fontSize: 15,
      lineHeight: 22,
      color: textSecondaryColor(colorScheme),
      marginHorizontal: 20,
      textAlign: "center",
    },
    address: {
      fontSize: 15,
      lineHeight: 22,
      color: textSecondaryColor(colorScheme),
      marginHorizontal: 20,
      textAlign: "center",
    },
    shareButtonContainer: {
      flex: 1,
      justifyContent: "flex-end",
      alignItems: "center",
      paddingHorizontal: theme.spacing.lg,
    },
    shareButtonContainerCompact: {
      flex: 0,
    },
    shareButtonIconCompact: {
      marginRight: 8,
      width: 16,
      height: 16,
      top: Platform.OS === "android" ? 2 : 0,
    },
    shareButtonCompact: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      marginTop: 4,
    },
    shareButtonTextCompact: {
      color: textPrimaryColor(colorScheme),
      fontSize: 15,
      marginTop: 4,
    },
  });
};
