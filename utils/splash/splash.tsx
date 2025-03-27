import * as SplashScreen from "expo-splash-screen"
import { captureError } from "@/utils/capture-error"
import { GenericError } from "@/utils/error"

export function preventSplashScreenAutoHide() {
  return SplashScreen.preventAutoHideAsync().catch((e) => {
    captureError(
      new GenericError({
        error: e,
        additionalMessage: "Error preventing splash screen from auto hiding",
      }),
    )
    /* reloading the app might trigger some race conditions, ignore them */
  })
}

export const hideSplashScreen = () => SplashScreen.hideAsync()
