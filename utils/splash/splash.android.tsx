import RNBootSplash from "react-native-bootsplash"

export function preventSplashScreenAutoHide() {
  // RNBootSplash keeps the splash screen visible by default until hide() is called
  return Promise.resolve()
}

export const hideSplashScreen = async () => {
  await RNBootSplash.hide({ fade: true })
}
