import { AppState } from "react-native";

import logger from "./logger";

/*
Method to wait until the app is in Foreground (Active)
helpful to make sure we're not doing critical database stuff
while the database is disconnected to prevent data loss
Will check every delayMs, then wait endDelayMs for db reconnection
*/
export const waitUntilAppActive = async (
  delayMs: number,
  endDelayMs: number
) => {
  let appWasInactive = false;
  while (AppState.currentState !== "active") {
    appWasInactive = true;
    logger.debug(`App is inactive, waiting ${delayMs}ms until back active`);
    await new Promise((r) => setTimeout(r, delayMs));
  }
  if (appWasInactive) {
    logger.debug(`App was inactive for a while, waiting ${endDelayMs}ms more`);
    await new Promise((r) => setTimeout(r, endDelayMs));
    if (AppState.currentState !== "active") {
      await waitUntilAppActive(delayMs, endDelayMs);
    }
  }
};
