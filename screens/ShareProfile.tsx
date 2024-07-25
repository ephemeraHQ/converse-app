import Clipboard from "@react-native-clipboard/clipboard";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { backgroundColor, textPrimaryColor } from "@styles/colors";
import React, { useEffect, useState } from "react";
import {
  Button,
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
import ConverseButton from "../components/Button/Button";
import config from "../config";
import {
  useCurrentAccount,
  useProfilesStore,
} from "../data/store/accountsStore";
import { isDesktop } from "../utils/device";
import { getPreferredUsername } from "../utils/profile";
import { shortAddress } from "../utils/str";

export default function ShareProfileScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "ShareProfile">) {
  const colorScheme = useColorScheme();
  const userAddress = useCurrentAccount() as string;
  const socials = useProfilesStore((s) => s.profiles[userAddress]?.socials);
  const mainIdentity = getPreferredUsername(socials);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        Platform.OS === "ios" ? (
          <Button
            title="Cancel"
            onPress={() => {
              navigation.goBack();
            }}
          />
        ) : (
          <AndroidBackAction navigation={navigation} />
        ),
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
        <View style={styles.qrCode}>
          <QRCode
            size={200}
            value={profileUrl}
            backgroundColor={backgroundColor(colorScheme)}
            color={textPrimaryColor(colorScheme)}
          />
        </View>
        <Text style={styles.identity}>
          {mainIdentity || shortAddress(userAddress || "")}
        </Text>
        <Text style={styles.address}>{userAddress}</Text>
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
      </View>
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
      justifyContent: "center",
    },
    shareProfileContent: {
      alignItems: "center",
    },
    qrCode: {
      marginBottom: 78,
    },
    identity: {
      color: textPrimaryColor(colorScheme),
      fontSize: 34,
      fontWeight: "700",
      marginBottom: 17,
      textAlign: "center",
    },
    address: {
      color: textPrimaryColor(colorScheme),
      fontSize: 17,
      fontWeight: "400",
      textAlign: "center",
    },
    shareButton: {
      marginTop: 31,
      maxWidth: Platform.OS === "web" ? 300 : undefined,
    },
  });
};
