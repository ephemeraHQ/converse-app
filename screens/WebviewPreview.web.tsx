import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

import AndroidBackAction from "../components/AndroidBackAction";
import { backgroundColor } from "../utils/colors";
import { NavigationParamList } from "./Navigation/Navigation";

export default function WebviewPreview({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "WebviewPreview">) {
  const colorScheme = useColorScheme();
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => <AndroidBackAction navigation={navigation} />,
    });
  }, [navigation]);
  return (
    <iframe
      src={route.params.uri}
      allowFullScreen
      style={{
        width: "100%",
        height: "100%",
        border: 0,
        outline: "none",
        backgroundColor: backgroundColor(colorScheme),
      }}
    />
  );
}
