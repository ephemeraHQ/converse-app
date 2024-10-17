import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { backgroundColor } from "@styles/colors";
import React, { useEffect } from "react";
import {
  Button,
  Platform,
  StyleSheet,
  View,
  useColorScheme,
} from "react-native";

import { NavigationParamList } from "./Navigation/Navigation";
import AndroidBackAction from "../components/AndroidBackAction";
import Recommendations from "../components/Recommendations/Recommendations";

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
      <Recommendations visibility="FULL" />
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
