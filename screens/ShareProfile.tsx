import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useContext, useEffect } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ColorSchemeName,
  useColorScheme,
  Share,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import ConverseButton from "../components/Button";
import config from "../config";
import { AppContext } from "../data/store/context";
import { backgroundColor, textPrimaryColor } from "../utils/colors";
import { shortAddress } from "../utils/str";
import { NavigationParamList } from "./Main";

export default function ShareProfileScreen({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "ShareProfile">) {
  const colorScheme = useColorScheme();
  const { state } = useContext(AppContext);
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Button
          title="Cancel"
          onPress={() => {
            navigation.goBack();
          }}
        />
      ),
    });
  }, [navigation]);
  const styles = getStyles(colorScheme);
  const profileUrl = `https://${config.websiteDomain}/dm/${
    state.app.mainIdentity || state.xmtp.address
  }`;
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
          {state.app.mainIdentity || shortAddress(state.xmtp.address || "")}
        </Text>
        <Text style={styles.address}>{state.xmtp.address}</Text>
        <ConverseButton
          variant="blue"
          title="Share link"
          style={styles.shareButton}
          picto="square.and.arrow.up"
          onPress={() => Share.share({ url: profileUrl })}
        />
      </View>
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
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
    },
  });
