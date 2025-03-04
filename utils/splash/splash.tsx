import * as SplashScreen from "expo-splash-screen"
import logger from "../logger"

export function preventSplashScreenAutoHide() {
  return SplashScreen.preventAutoHideAsync().catch((e) => {
    logger.error("Error preventing splash screen from auto hiding", e)
    /* reloading the app might trigger some race conditions, ignore them */
  })
}

export const hideSplashScreen = () => SplashScreen.hideAsync()
