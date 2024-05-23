import { Platform } from "react-native";

import { isDesktop } from "./device";

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
      break;
    case "android":
      analyticsPlatform = "Android";
      break;
    case "web":
      analyticsPlatform = "Web";
      break;

    default:
      break;
  }
}
