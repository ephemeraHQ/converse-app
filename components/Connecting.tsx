import { useContext } from "react";
import { View, Text, useColorScheme, Platform } from "react-native";

import { AppContext } from "../data/deprecatedStore/context";
import { useChatStore } from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { textPrimaryColor } from "../utils/colors";
import { pick } from "../utils/objects";
import ActivityIndicator from "./ActivityIndicator/ActivityIndicator";

export const useShouldShowConnecting = () => {
  const isInternetReachable = useAppStore((s) => s.isInternetReachable);
  const { localClientConnected, webviewClientConnected, reconnecting } =
    useChatStore((s) =>
      pick(s, [
        "localClientConnected",
        "webviewClientConnected",
        "reconnecting",
      ])
    );
  return (
    !isInternetReachable ||
    !localClientConnected ||
    !webviewClientConnected ||
    reconnecting
  );
};

export const useShouldShowConnectingOrSyncing = () => {
  const { state } = useContext(AppContext);
  const { initialLoadDoneOnce } = useChatStore((s) =>
    pick(s, ["initialLoadDoneOnce"])
  );
  const shouldShowConnecting = useShouldShowConnecting();
  return (
    shouldShowConnecting ||
    (!initialLoadDoneOnce && Object.keys(state.xmtp.conversations).length > 0)
  );
};

export default function Connecting() {
  const colorScheme = useColorScheme();
  const shouldShowConnecting = useShouldShowConnecting();

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
