import { useContext, useEffect } from "react";
import { View, Text, useColorScheme, Platform } from "react-native";

import { AppContext, StateType } from "../data/store/context";
import { textPrimaryColor } from "../utils/colors";
import ActivityIndicator from "./ActivityIndicator/ActivityIndicator";

export const shouldShowConnecting = (state: StateType) =>
  !state.app.isInternetReachable ||
  !state.xmtp.localConnected ||
  !state.xmtp.webviewConnected ||
  state.xmtp.reconnecting;

export const shouldShowConnectingOrSyncing = (state: StateType) =>
  shouldShowConnecting(state) ||
  (!state.xmtp.initialLoadDoneOnce &&
    Object.keys(state.xmtp.conversations).length > 0);

export let isReconnecting = false;

export default function Connecting() {
  const colorScheme = useColorScheme();
  const { state } = useContext(AppContext);
  useEffect(() => {
    isReconnecting = shouldShowConnecting(state);
  }, [state]);
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <ActivityIndicator />
      <Text
        style={{
          marginLeft: 10,
          color: textPrimaryColor(colorScheme),
          ...Platform.select({
            android: { fontSize: 22, fontFamily: "Roboto" },
          }),
        }}
      >
        {shouldShowConnecting(state) ? "Connecting" : "Syncing"}
      </Text>
    </View>
  );
}
