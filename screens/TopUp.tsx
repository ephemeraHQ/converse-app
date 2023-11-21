import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
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
import TableView from "../components/TableView/TableView";
import { TableViewPicto } from "../components/TableView/TableViewImage";
import config from "../config";
import { useCurrentAccount } from "../data/store/accountsStore";
import {
  backgroundColor,
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
      <Image
        source={require("../assets/top-up.png")}
        style={styles.topUpImage}
      />
      <Text style={styles.title}>Read this</Text>
      <Text style={styles.p}>
        Send the money to the <Text style={styles.bold}>right chain</Text> with
        the <Text style={styles.bold}>right currency</Text>! And{" "}
        <Text
          style={styles.primary}
          onPress={() => {
            navigation.pop(2);
            setTimeout(() => {
              navigation.push("Conversation", {
                mainConversationWithPeer: config.polAddress,
              });
            }, 300);
          }}
        >
          ask me
        </Text>{" "}
        if you have no idea what I’m talking about.
      </Text>
      <Text style={[styles.title, { marginBottom: 23 }]}>Chain = BASE</Text>
      <Text style={styles.title}>Currency = USDC</Text>
      <Text style={styles.p}>Not USDbC (bridged) or any other asset</Text>
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
                  Clipboard.setStringAsync(userAddress || "");
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
    topUpImage: {
      width: 120,
      height: 135,
      marginVertical: 23,
    },
    title: {
      color: textPrimaryColor(colorScheme),
      fontSize: 34,
      fontWeight: "700",
      textAlign: "center",
    },
    p: {
      color: textPrimaryColor(colorScheme),
      fontSize: 17,
      textAlign: "center",
      marginTop: 17,
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
