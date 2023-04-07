import { useContext, useEffect } from "react";
import { View, Text } from "react-native";

import { AppContext, StateType } from "../data/store/context";
import ActivityIndicator from "./ActivityIndicator/ActivityIndicator";

export const shouldShowConnecting = (state: StateType) =>
  !state.app.isInternetReachable ||
  !state.xmtp.localConnected ||
  !state.xmtp.webviewConnected ||
  state.xmtp.reconnecting;

export let isReconnecting = false;

export default function Connecting() {
  const { state } = useContext(AppContext);
  useEffect(() => {
    isReconnecting = shouldShowConnecting(state);
  }, [state]);
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <ActivityIndicator />
      <Text style={{ marginLeft: 10 }}>Connecting</Text>
    </View>
  );
}
