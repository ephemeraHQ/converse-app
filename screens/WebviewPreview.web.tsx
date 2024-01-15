import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";

import AndroidBackAction from "../components/AndroidBackAction";
import { NavigationParamList } from "./Navigation/Navigation";

export default function WebviewPreview({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "WebviewPreview">) {
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => <AndroidBackAction navigation={navigation} />,
    });
  }, [navigation]);
  return (
    <iframe
      src={route.params.uri}
      allowFullScreen
      style={{ width: "100%", height: "100%", border: 0, outline: "none" }}
    />
  );
}
