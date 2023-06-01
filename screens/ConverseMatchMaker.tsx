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
import {
  backgroundColor,
  textPrimaryColor,
  textSecondaryColor,
} from "../utils/colors";
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

      <ScrollView
        style={styles.modal}
        contentContainerStyle={styles.modalContent}
        keyboardShouldPersistTaps="handled"
      >
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
    modalContent: {
      flexGrow: 1,
    },
    wave: {
      textAlign: "center",
      marginTop: 30,
      fontSize: 34,
    },
    title: {
      ...Platform.select({
        default: {
          fontSize: 17,
          paddingHorizontal: 32,
          color: textPrimaryColor(colorScheme),
        },
        android: {
          fontSize: 14,
          paddingHorizontal: 39,
          color: textSecondaryColor(colorScheme),
        },
      }),

      textAlign: "center",

      marginTop: 12,
      marginBottom: 30,
    },
  });
