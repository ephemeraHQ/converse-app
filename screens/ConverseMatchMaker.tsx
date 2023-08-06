import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  Button,
  StyleSheet,
  View,
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

  return (
    <View style={styles.modal}>
      {Platform.OS === "ios" && <StatusBar hidden={false} style="light" />}
      <Recommendations navigation={navigation} visibility="FULL" />
    </View>
  );
}

const useStyles = () => {
  const colorScheme = useColorScheme();
  return StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: backgroundColor(colorScheme),
    },
  });
};
