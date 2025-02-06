import * as SplashScreen from "expo-splash-screen";

export function preventSplashScreenAutoHide() {
  return SplashScreen.preventAutoHideAsync().catch(() => {
    /* reloading the app might trigger some race conditions, ignore them */
  });
}

export const hideSplashScreen = () => SplashScreen.hideAsync();
