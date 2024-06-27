import { setAndroidColors } from "@styles/colors/helpers";
import { Appearance } from "react-native";
import RNBootSplash from "react-native-bootsplash";

export const hideSplashScreen = async () => {
  await RNBootSplash.hide();
  // Fixing the status bar after hiding Splash Screen
  // TODO => try to upgrade RNBootSplash and play
  // with the XML values
  setAndroidColors(Appearance.getColorScheme());
  setTimeout(() => {
    setAndroidColors(Appearance.getColorScheme());
  }, 10);
  setTimeout(() => {
    setAndroidColors(Appearance.getColorScheme());
  }, 100);
};
