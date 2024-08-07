import logger from "@utils/logger";
import { Platform } from "react-native";

import { setConsent } from "./001-setConsent";
import { setTopicsData } from "./002-setTopicsData";
import appJson from "../../app.json";
import { getAccountsList, getSettingsStore } from "../store/accountsStore";
import { useAppStore } from "../store/appStore";

type Step = {
  id: number;
  method: (account: string) => Promise<void>;
};

let isRunning = false;

export const updateSteps: Step[] = [
  { id: 1, method: setConsent },
  { id: 2, method: setTopicsData },
  // Add more update steps by sequentially incrementing the id
];

const waitForAsyncUpdatesToFinish = async () => {
  if (!isRunning) return;
  await new Promise((resolve) => setTimeout(resolve, 200));
  await waitForAsyncUpdatesToFinish();
};

export const updateLastVersionOpen = () => {
  logger.debug(
    `[Async Updates] Last version open: ${
      useAppStore.getState().lastVersionOpen
    }`
  );
  const version =
    Platform.OS === "ios"
      ? appJson.expo.ios.version
      : appJson.expo.android.version;
  useAppStore.getState().setLastVersionOpen(version);
};

export const runAsyncUpdates = async () => {
  if (isRunning) {
    await waitForAsyncUpdatesToFinish();
    return;
  }
  isRunning = true;

  const accountList = getAccountsList();

  for (const account of accountList) {
    logger.debug(`[Async Updates] Account: ${account}`);
    await runAsyncUpdatesForAccount(account);
  }

  isRunning = false;
};

const runAsyncUpdatesForAccount = async (account: string) => {
  const lastAsyncUpdate = getSettingsStore(account).getState().lastAsyncUpdate;
  logger.debug(`[Async Updates] lastAsyncUpdate: ${lastAsyncUpdate}`);

  for (const updateKey of updateSteps) {
    if (updateKey.id > lastAsyncUpdate) {
      try {
        const update = updateKey.method(account);
        if (update) {
          await update;
          getSettingsStore(account).getState().setLastAsyncUpdate(updateKey.id);
        } else {
          logger.error(
            `[Async Updates] Failed to run migration: ${updateKey} [Error: migration function not found]`
          );
        }
      } catch (error) {
        logger.error(
          `[Async Updates] Failed to run migration: ${updateKey} [Error: ${error}]`
        );
        // Break out in case of error
        break;
      }
    } else {
      console.info("[Async Updates] No update to run");
    }
  }
};
