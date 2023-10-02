import { Platform } from "react-native";

import appJson from "../../app.json";
import { useAppStore } from "../store/appStore";
import { setConsent } from "./001-setConsent";

type Step = {
  id: string;
  method: () => Promise<void>;
};

type Steps = Step[];

const updateSteps: Steps = [{ id: "setConsent001", method: setConsent }];

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

export const runAsyncUpdates = async () => {
  const isInternetReachable = useAppStore.getState().isInternetReachable;
  let lastUpdateRan = useAppStore.getState().lastUpdateRan;

  if (isInternetReachable) {
    for (const updateKey of updateSteps) {
      if (updateKey.id > lastUpdateRan) {
        try {
          const update = updateKey.method;
          if (update) {
            await update();
            useAppStore.getState().setLastUpdateRan(updateKey.id);
            lastUpdateRan = updateKey.id;
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
  } else {
    await new Promise((r) => setTimeout(r, 2000));
    runAsyncUpdates();
  }
};
