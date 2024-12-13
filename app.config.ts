import { ConfigContext, ExpoConfig } from "expo/config";
import warnOnce from "warn-once";

import appBuildNumbers from "./app.json";

const env = process.env as any;
const isDev = env.EXPO_ENV === "dev";

warnOnce(
  isDev && !(process.env as any).EXPO_PUBLIC_DEV_API_URI,
  "\n\n🚧 Running the app without EXPO_PUBLIC_DEV_API_URI setup\n\n"
);

const isPreview = env.EXPO_ENV === "preview";
const isProduction = !isDev && !isPreview;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: isDev ? "Converse DEV" : isPreview ? "Converse PREVIEW" : "Converse",
  scheme: isDev ? "converse-dev" : isPreview ? "converse-preview" : "converse",
  slug: "converse",
  orientation: "portrait",
  icon: isProduction ? "./assets/icon.png" : "./assets/icon-preview.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: "https://u.expo.dev/49a65fae-3895-4487-8e8a-5bd8bee3a401",
  },
  version: appBuildNumbers.expo.version,
  assetBundlePatterns: ["**/*"],
  plugins: [
    "@react-native-firebase/app-check",
    ["expo-build-properties", { ios: { useFrameworks: "static" } }],
  ],
  ios: {
    supportsTablet: true,
    buildNumber: appBuildNumbers.expo.ios.buildNumber,
    bundleIdentifier: "com.converse.dev",
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    package: "com.converse.dev",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FFFFFF",
    },
    versionCode: appBuildNumbers.expo.android.versionCode,
    googleServicesFile: "./android/google-services.json",
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
  extra: {
    eas: {
      projectId: "49a65fae-3895-4487-8e8a-5bd8bee3a401",
    },
    ENV: isDev ? "dev" : isPreview ? "preview" : "prod",
  },
  runtimeVersion: appBuildNumbers.expo.version,
  owner: "converse",
  jsEngine: "hermes",
});
