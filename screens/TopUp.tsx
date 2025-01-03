import Clipboard from "@react-native-clipboard/clipboard";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  backgroundColor,
  listItemSeparatorColor,
  primaryColor,
  textPrimaryColor,
} from "@styles/colors";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

import AndroidBackAction from "../components/AndroidBackAction";
import ConverseButton from "../components/Button/Button";
import TableView from "../components/TableView/TableView";
import { TableViewPicto } from "../components/TableView/TableViewImage";
import config from "../config";
import { NavigationParamList } from "./Navigation/Navigation";
import { useCurrentAccount } from "../data/store/accountsStore";
import { translate } from "@/i18n";

export default function TopUp({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "TopUp">) {
  const styles = useStyles();
  const userAddress = useCurrentAccount();
  const colorScheme = useColorScheme();
  const [copiedAddress, setCopiedAddress] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        Platform.OS === "ios" ? (
          <ConverseButton
            title={translate("cancel")}
            onPress={() => {
              navigation.goBack();
            }}
          />
        ) : (
          <AndroidBackAction navigation={navigation} />
        ),
    });
  }, [navigation]);

  return (
    <View style={styles.topUp}>
      <ConverseButton
        action="primary"
        title={translate("top_up.title")}
        style={styles.bridgeButton}
        onPress={() => {
          Linking.openURL(
            `https://${config.websiteDomain}/bridge/${userAddress}`
          );
        }}
      />
      <View style={styles.separator} />
      <Text style={styles.p}>
        {translate("top_up.alternatively")}
        <Text style={styles.bold}>{translate("top_up.usdc")}</Text>{" "}
        {translate("top_up.native")}
        <Text style={styles.bold}>{translate("top_up.base")}</Text>
        {translate("top_up.to_your_address")}
      </Text>
      <TableView
        style={{ width: "100%" }}
        items={[
          {
            id: "address",
            title: userAddress || "",
            titleNumberOfLines: 2,
            rightView: (
              <TouchableOpacity
                onPress={() => {
                  setCopiedAddress(true);
                  Clipboard.setString(userAddress || "");
                  setTimeout(() => {
                    setCopiedAddress(false);
                  }, 1000);
                }}
              >
                <TableViewPicto
                  symbol={copiedAddress ? "checkmark" : "doc.on.doc"}
                  color={
                    Platform.OS === "android"
                      ? primaryColor(colorScheme)
                      : undefined
                  }
                />
              </TouchableOpacity>
            ),
          },
        ]}
      />
      <Image
        style={{ width: 305, height: 110, marginTop: 16 }}
        source={
          colorScheme === "dark"
            ? require("../assets/baseUSDCOnly-dark.png")
            : require("../assets/baseUSDCOnly-light.png")
        }
      />
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    topUp: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
      paddingHorizontal: 32,
      alignItems: "center",
    },
    bridgeButton: {
      marginVertical: 46,
    },
    separator: {
      height: 1,
      backgroundColor: listItemSeparatorColor(colorScheme),
      width: "100%",
      marginBottom: 46,
    },
    p: {
      color: textPrimaryColor(colorScheme),
      fontSize: 17,
      textAlign: "center",
      marginBottom: 23,
    },
    bold: {
      fontWeight: "700",
    },
    primary: {
      color: primaryColor(colorScheme),
    },
  });
};
