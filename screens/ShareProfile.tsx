import Clipboard from "@react-native-clipboard/clipboard";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  useColorScheme,
  Share,
  Platform,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import AndroidBackAction from "../components/AndroidBackAction";
import ConverseButton from "../components/Button/Button";
import config from "../config";
import {
  useCurrentAccount,
  useProfilesStore,
} from "../data/store/accountsStore";
import { backgroundColor, textPrimaryColor } from "../utils/colors";
import { isDesktop } from "../utils/device";
import { shortAddress } from "../utils/str";
import { NavigationParamList } from "./Navigation/Navigation";

export default function ShareProfileScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "ShareProfile">) {
  const colorScheme = useColorScheme();
  const userAddress = useCurrentAccount() as string;
  const mainIdentity = useProfilesStore(
    (s) =>
      s.profiles[userAddress]?.socials?.ensNames?.find((n) => n.isPrimary)?.name
  );
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
      {Platform.OS === "ios" && <StatusBar hidden={false} style="light" />}
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
      paddingHorizontal: 32,
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
