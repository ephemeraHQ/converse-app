import { logger } from "@utils/logger"
import { AppState } from "react-native"

/*
Method to wait until the app is in Foreground (Active)
helpful to make sure we're not doing critical database stuff
while the database is disconnected to prevent data loss
Will check every delayMs, then wait endDelayMs for db reconnection
*/
export const waitUntilAppActive = async (endDelayMs: number) => {
  // If app is active, return immediatly
  if (AppState.currentState === "active") return
  logger.debug(`Waiting until app is back into active state...`)
  return new Promise((resolve) => {
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      if (nextAppState === "active") {
        subscription.remove()
        logger.debug(`App was inactive for a while, waiting ${endDelayMs}ms more`)
        await new Promise((r) => setTimeout(r, endDelayMs))
        // Check if app is still active after endDelayMs
        if (AppState.currentState !== "active") {
          await waitUntilAppActive(endDelayMs)
        } else {
          resolve(undefined)
        }
      }
    })
  })
}
