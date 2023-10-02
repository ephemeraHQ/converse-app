import { Platform } from "react-native";

import appJson from "../../app.json";
import { useAppStore } from "../store/appStore";

export const updateLastVersionOpen = () => {
  console.log("Last version open: ", useAppStore.getState().lastVersionOpen);
  const version =
    Platform.OS === "ios"
      ? appJson.expo.ios.version
      : appJson.expo.android.version;
  useAppStore.getState().setLastVersionOpen(version);
};

export const useAsyncUpdates = () => {
  const isInternetReachable = useAppStore((s) => s.isInternetReachable);

  // Perform async updates only if we have internet
  if (isInternetReachable) {
    console.log("Internet is reachable, performing update");
  }

  // Check if we need to migrate data
  // migrateDataIfNeeded();
};
