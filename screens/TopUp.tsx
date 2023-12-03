import Clipboard from "@react-native-clipboard/clipboard";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Button,
  TouchableOpacity,
} from "react-native";

import AndroidBackAction from "../components/AndroidBackAction";
import ConverseButton from "../components/Button/Button";
import TableView from "../components/TableView/TableView";
import { TableViewPicto } from "../components/TableView/TableViewImage";
import config from "../config";
import { useCurrentAccount } from "../data/store/accountsStore";
import {
  backgroundColor,
  listItemSeparatorColor,
  primaryColor,
  textPrimaryColor,
} from "../utils/colors";
import { NavigationParamList } from "./Navigation/Navigation";

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

  return (
    <View style={styles.topUp}>
      <ConverseButton
        variant="primary"
        title="Bridge from any wallet"
        style={styles.bridgeButton}
        onPress={() => {
          Linking.openURL(
            `https://${config.websiteDomain}/bridge/${userAddress}`
          );
        }}
      />
      <View style={styles.separator} />
      <Text style={styles.p}>
        Alternatively, if you want to do it by yourself, send{" "}
        <Text style={styles.bold}>USDC</Text> (native, not USDbC) on the{" "}
        <Text style={styles.bold}>Base</Text> blockchain to your address (see
        address below).
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
