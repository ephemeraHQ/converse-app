import { View, Text, useColorScheme, Platform } from "react-native";

import { useChatStore } from "../data/store/accountsStore";
import { useAppStore } from "../data/store/appStore";
import { useSelect } from "../data/store/storeHelpers";
import { textPrimaryColor } from "../utils/colors";
import ActivityIndicator from "./ActivityIndicator/ActivityIndicator";

export const useShouldShowConnecting = () => {
  const isInternetReachable = useAppStore((s) => s.isInternetReachable);
  const { localClientConnected, reconnecting } = useChatStore(
    useSelect(["localClientConnected", "reconnecting"])
  );
  return !isInternetReachable || !localClientConnected || reconnecting;
};

export const useShouldShowConnectingOrSyncing = () => {
  const { initialLoadDoneOnce, conversations } = useChatStore(
    useSelect(["initialLoadDoneOnce", "conversations"])
  );
  const shouldShowConnecting = useShouldShowConnecting();
  return (
    shouldShowConnecting ||
    (!initialLoadDoneOnce && Object.keys(conversations).length > 0)
  );
};

export default function Connecting() {
  const colorScheme = useColorScheme();
  const shouldShowConnecting = useShouldShowConnecting();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: Platform.OS === "ios" ? 110 : 130,
      }}
    >
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
