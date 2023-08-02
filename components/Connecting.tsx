import { useContext, useEffect } from "react";
import { View, Text, useColorScheme, Platform } from "react-native";

import { AppContext } from "../data/deprecatedStore/context";
import { useAppStore } from "../data/store/appStore";
import { textPrimaryColor } from "../utils/colors";
import ActivityIndicator from "./ActivityIndicator/ActivityIndicator";

export const useShouldShowConnecting = () => {
  const { state } = useContext(AppContext);
  const isInternetReachable = useAppStore((s) => s.isInternetReachable);
  return (
    !isInternetReachable ||
    !state.xmtp.localConnected ||
    !state.xmtp.webviewConnected ||
    state.xmtp.reconnecting
  );
};

export const useShouldShowConnectingOrSyncing = () => {
  const { state } = useContext(AppContext);
  const shouldShowConnecting = useShouldShowConnecting();
  return (
    shouldShowConnecting ||
    (!state.xmtp.initialLoadDoneOnce &&
      Object.keys(state.xmtp.conversations).length > 0)
  );
};

export let isReconnecting = false;

export default function Connecting() {
  const colorScheme = useColorScheme();
  const shouldShowConnecting = useShouldShowConnecting();
  useEffect(() => {
    isReconnecting = shouldShowConnecting;
  }, [shouldShowConnecting]);
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
        {shouldShowConnecting ? "Connecting" : "Syncing"}
      </Text>
    </View>
  );
}
