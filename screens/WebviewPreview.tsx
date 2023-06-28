import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { Platform, Button } from "react-native";
import { WebView } from "react-native-webview";

import AndroidBackAction from "../components/AndroidBackAction";
import { NavigationParamList } from "./Main";

export default function WebviewPreview({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "WebviewPreview">) {
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
    <WebView
      autoManageStatusBarEnabled={false}
      source={{
        uri: route.params.uri,
      }}
      javaScriptEnabled
      originWhitelist={["*"]}
      allowFileAccess
    />
  );
}
