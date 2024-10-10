import { DependencyFlavor, DependencyFlavors } from "./flavors.type";

export function determineDependencyFlavor(): DependencyFlavor {
  if (typeof jest !== "undefined" || process.env.JEST_WORKER_ID !== undefined) {
    return DependencyFlavors.jest;
  }

  try {
    const { Platform } = require("react-native");

    if (Platform.OS === "ios") {
      return Platform.constants.interfaceIdiom === "simulator"
        ? DependencyFlavors.iosSimulator
        : DependencyFlavors.iosDevice;
    } else if (Platform.OS === "android") {
      return Platform.constants.Brand === "google" &&
        Platform.constants.Model.includes("sdk")
        ? DependencyFlavors.androidEmulator
        : DependencyFlavors.androidDevice;
    }
  } catch (error) {
    console.error("Error determining platform:", error);
  }

  return DependencyFlavors.Unknown;
}
