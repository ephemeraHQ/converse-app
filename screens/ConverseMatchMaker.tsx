import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect } from "react";
import {
  Button,
  StyleSheet,
  View,
  useColorScheme,
  Platform,
} from "react-native";

import AndroidBackAction from "../components/AndroidBackAction";
import Recommendations from "../components/Recommendations/Recommendations";
import { backgroundColor } from "../utils/colors";
import { NavigationParamList } from "./Navigation/Navigation";

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
