import { View, Text } from "react-native";

import { StateType } from "../data/store/context";
import ActivityIndicator from "./ActivityIndicator/ActivityIndicator";

export const shouldShowConnecting = (state: StateType) =>
  !state.app.isInternetReachable ||
  !state.xmtp.localConnected ||
  !state.xmtp.webviewConnected ||
  state.xmtp.reconnecting;

export default function Connecting() {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <ActivityIndicator />
      <Text style={{ marginLeft: 10, fontSize: 17 }}>Connecting</Text>
    </View>
  );
}
