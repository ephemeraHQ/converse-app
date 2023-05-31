import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  Button,
  ScrollView,
  StyleSheet,
  View,
  ColorSchemeName,
  useColorScheme,
  Platform,
  Text,
} from "react-native";

import AndroidBackAction from "../components/AndroidBackAction";
import Recommendations from "../components/Recommendations";
import { backgroundColor } from "../utils/colors";
import { NavigationParamList } from "./Main";

export default function ConverseMatchMaker({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "ConverseMatchMaker">) {
  const colorScheme = useColorScheme();
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

  const styles = getStyles(colorScheme);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "white",
      }}
    >
      {Platform.OS === "ios" && <StatusBar hidden={false} style="light" />}

      <ScrollView style={styles.modal} keyboardShouldPersistTaps="handled">
        <Text style={styles.wave}>👋</Text>
        <Text style={styles.title}>
          Find people who have interests in common with you. Start talking to
          them.
        </Text>
        <Recommendations navigation={navigation} />
      </ScrollView>
    </View>
  );
}

const getStyles = (colorScheme: ColorSchemeName) =>
  StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
    wave: {
      textAlign: "center",
      marginTop: 30,
      fontSize: 34,
    },
    title: {
      fontSize: 17,
      textAlign: "center",
      paddingHorizontal: 32,
      marginTop: 12,
      marginBottom: 30,
    },
  });
