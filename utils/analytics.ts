import Constants from "expo-constants";
import { Platform } from "react-native";

import { isDesktop } from "./device";

export const analyticsAppVersion = Constants.expoConfig?.version;

export let analyticsBuildNumber = undefined as string | number | undefined;

export let analyticsPlatform = undefined as
  | "iOS"
  | "Android"
  | "Web"
  | "macOS"
  | undefined;

if (isDesktop) {
  analyticsPlatform = "macOS";
} else {
  switch (Platform.OS) {
    case "ios":
      analyticsPlatform = "iOS";
      analyticsBuildNumber = Constants.expoConfig?.ios?.buildNumber;
      break;
    case "android":
      analyticsPlatform = "Android";
      analyticsBuildNumber = Constants.expoConfig?.android?.versionCode;
      break;
    case "web":
      analyticsPlatform = "Web";
      break;

    default:
      break;
  }
}
