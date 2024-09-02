import Clipboard from "@react-native-clipboard/clipboard";
import { useHeaderHeight } from "@react-navigation/elements";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "@styles/colors";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Share,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import { NavigationParamList } from "./Navigation/Navigation";
import AndroidBackAction from "../components/AndroidBackAction";
import Avatar from "../components/Avatar";
import ConverseButton from "../components/Button/Button";
import config from "../config";
import {
  useCurrentAccount,
  useProfilesStore,
} from "../data/store/accountsStore";
import { isDesktop } from "../utils/device";
import {
  getPreferredUsername,
  getPreferredAvatar,
  getPreferredName,
} from "../utils/profile";
import { shortAddress } from "../utils/str";

export default function ShareProfileScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "ShareProfile">) {
  const colorScheme = useColorScheme();
  const headerHeight = useHeaderHeight();
  const userAddress = useCurrentAccount() as string;
  const socials = useProfilesStore((s) => s.profiles[userAddress]?.socials);
  const mainIdentity = getPreferredUsername(socials);
  const displayName = getPreferredName(socials, userAddress);
  const avatar = getPreferredAvatar(socials);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        Platform.OS === "ios" && (
          <ConverseButton
            title=""
            variant="text"
            picto="xmark"
            // color={textPrimaryColor(colorScheme)}
            onPress={() => {
              navigation.goBack();
            }}
          />
        ),
      headerLeft: () =>
        Platform.OS !== "ios" && <AndroidBackAction navigation={navigation} />,
    });
  }, [navigation]);
  const styles = useStyles();
  const profileUrl = `https://${config.websiteDomain}/dm/${
    mainIdentity || userAddress
  }`;

  const shareDict =
    Platform.OS === "ios" && !isDesktop
      ? { url: profileUrl }
      : { message: profileUrl };

  const [copiedLink, setCopiedLink] = useState(false);

  return (
    <View style={styles.shareProfile}>
      <View style={styles.shareProfileContent}>
        <View>
          <Avatar uri={avatar} name={displayName} style={styles.avatar} />
          <Text style={styles.identity}>
            {displayName || mainIdentity || shortAddress(userAddress || "")}
          </Text>
          <Text style={styles.username}>
            {mainIdentity || shortAddress(userAddress || "")}
          </Text>
          {mainIdentity && (
            <Text style={styles.address}>
              {shortAddress(userAddress || "")}
            </Text>
          )}
        </View>

        <View style={styles.qrCode}>
          <QRCode
            size={220}
            value={profileUrl}
            backgroundColor={backgroundColor(colorScheme)}
            color={textPrimaryColor(colorScheme)}
          />
        </View>
      </View>
      <ConverseButton
        variant="primary"
        title={
          Platform.OS === "web"
            ? copiedLink
              ? "Link copied"
              : "Copy link"
            : "Share link"
        }
        style={styles.shareButton}
        picto={
          Platform.OS === "web"
            ? copiedLink
              ? "checkmark"
              : "doc.on.doc"
            : "square.and.arrow.up"
        }
        onPress={() => {
          if (Platform.OS === "web") {
            setCopiedLink(true);
            Clipboard.setString(profileUrl);
            setTimeout(() => {
              setCopiedLink(false);
            }, 1000);
          } else {
            Share.share(shareDict);
          }
        }}
      />
      <View style={{ height: headerHeight }} />
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    shareProfile: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
      paddingHorizontal: 30,
      justifyContent: "flex-end",
    },
    shareProfileContent: {
      alignItems: "center",
      flex: 1,
    },
    avatar: {
      alignSelf: "center",
    },
    qrCode: {},
    identity: {
      color: textPrimaryColor(colorScheme),
      fontSize: 25,
      fontWeight: "600",
      textAlign: "center",
      marginTop: 12,
    },
    username: {
      fontSize: 15,
      lineHeight: 22,
      color: textSecondaryColor(colorScheme),
      marginHorizontal: 20,
      textAlign: "center",
      marginTop: 8,
    },
    address: {
      fontSize: 15,
      lineHeight: 22,
      color: textSecondaryColor(colorScheme),
      marginHorizontal: 20,
      textAlign: "center",
      marginBottom: 14,
    },
    shareButton: {
      maxWidth: Platform.OS === "web" ? 300 : undefined,
    },
  });
};
