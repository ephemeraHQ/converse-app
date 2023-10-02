import { Platform } from "react-native";

import appJson from "../../app.json";
import { useAppStore } from "../store/appStore";
import { setConsent } from "./001-setConsent";

type UpdatesMap = {
  [key: string]: () => Promise<void>;
};

export const updateSteps: UpdatesMap = {
  "001-setConsent": setConsent,
};

export const updateLastVersionOpen = () => {
  console.log(
    "[Async Updates] Last version open: ",
    useAppStore.getState().lastVersionOpen
  );
  const version =
    Platform.OS === "ios"
      ? appJson.expo.ios.version
      : appJson.expo.android.version;
  useAppStore.getState().setLastVersionOpen(version);
};

export const useAsyncUpdates = async () => {
  const isInternetReachable = useAppStore((s) => s.isInternetReachable);
  const lastUpdateRan = useAppStore((s) => s.lastUpdateRan);
  const setLastUpdateRan = useAppStore((s) => s.setLastUpdateRan);

  if (isInternetReachable) {
    const updateKeys = Object.keys(updateSteps);

    // Do we have updates to run?
    console.log("[Async Updates] lastUpdateRan: ", lastUpdateRan);

    for (const updateKey of updateKeys) {
      if (updateKey > lastUpdateRan) {
        try {
          const update = updateSteps[updateKey];
          if (update) {
            update();
            setLastUpdateRan(updateKey);
          } else {
            console.error(
              `[Async Updates] Failed to run migration: ${updateKey} [Error: migration function not found]`
            );
          }
        } catch (error) {
          console.error(
            `[Async Updates] Failed to run migration: ${updateKey} [Error: ${error}]`
          );
          // Break out in case of error
          break;
        }
      }
    }
  }
};
