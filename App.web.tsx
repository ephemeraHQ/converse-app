import "@expo/metro-runtime";
import { PrivyProvider } from "@privy-io/expo";

import "./polyfills";
import { View, Text } from "react-native";

import config from "./config";

export default function App() {
  return (
    <PrivyProvider appId={config.privyAppId}>
      <View>
        <Text>COUCOU WEB</Text>
      </View>
    </PrivyProvider>
  );
}
