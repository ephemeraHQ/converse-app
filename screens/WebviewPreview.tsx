import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  setAndroidColors,
  setAndroidSystemColor,
} from "@styles/colors/helpers";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { WebView } from "react-native-webview";
import { NavigationParamList } from "./Navigation/Navigation";

export function WebviewPreview({
  route,
  navigation,
}: NativeStackScreenProps<NavigationParamList, "WebviewPreview">) {
  // This is a trick because on Android, the setAllowFileAccess method
  // was called AFTER the setAllowFileAccess method and first file
  // uri could not be loaded. That way we start with a blank screen and
  // immediatly after we load our local URI
  const [uri, setUri] = useState("");
  useEffect(() => {
    setImmediate(() => {
      setUri(route.params.uri);
    });
  }, [route.params.uri]);
  const colorScheme = useColorScheme();
  useEffect(() => {
    setAndroidSystemColor("#000000");
    return () => {
      setAndroidColors(colorScheme);
    };
  }, [colorScheme]);
  return (
    <WebView
      autoManageStatusBarEnabled={false}
      source={{
        uri,
      }}
      javaScriptEnabled
      originWhitelist={["*"]}
      allowFileAccess
      androidLayerType="hardware"
    />
  );
}
