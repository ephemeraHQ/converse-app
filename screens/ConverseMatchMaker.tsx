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

      <ScrollView
        style={styles.modal}
        contentContainerStyle={styles.modalContent}
        keyboardShouldPersistTaps="handled"
      >
        <Recommendations navigation={navigation} visibility="FULL" />
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
  });
