import { ConfigContext, ExpoConfig } from "expo/config";
import warnOnce from "warn-once";
// Removed this import as it was causing a build error
// import type { PluginConfigTypeAndroid } from "expo-build-properties/src/pluginConfig";

import appBuildNumbers from "./app.json";
import { getEnv, isDev, isPreview, isProd } from "./utils/getEnv";

warnOnce(
  isDev && !(process.env as any).EXPO_PUBLIC_DEV_API_URI,
  "\n\n🚧 Running the app without EXPO_PUBLIC_DEV_API_URI setup\n\n"
);

const isProduction = !isDev && !isPreview;

const scheme = isDev
  ? "converse-dev"
  : isPreview
    ? "converse-preview"
    : "converse";
const androidPackage = isDev
  ? "com.converse.dev"
  : isPreview
    ? "com.converse.preview"
    : "com.converse.prod";
const appDomainConverse = isDev
  ? "dev.converse.xyz"
  : isPreview
    ? "preview.converse.xyz"
    : "converse.xyz";
const appDomainGetConverse = isDev
  ? "dev.getconverse.app"
  : isPreview
    ? "dev.getconverse.app"
    : isProd
      ? "getconverse.app"
      : "preview.getconverse.app";

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
  extra: {
    eas: {
      projectId: "49a65fae-3895-4487-8e8a-5bd8bee3a401",
    },
    ENV: getEnv(),
  },
  runtimeVersion: appBuildNumbers.expo.version,
  owner: "converse",
  jsEngine: "hermes",
  ios: {
    supportsTablet: true,
    buildNumber: appBuildNumbers.expo.ios.buildNumber,
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    versionCode: appBuildNumbers.expo.android.versionCode,
    package: androidPackage,
    googleServicesFile: isDev
      ? "./scripts/build/android/google-services/dev.json"
      : isPreview
        ? "./scripts/build/android/google-services/preview.json"
        : "./scripts/build/android/google-services/production.json",
    permissions: [
      "INTERNET",
      "READ_EXTERNAL_STORAGE",
      "SYSTEM_ALERT_WINDOW",
      "VIBRATE",
      "POST_NOTIFICATIONS",
      "READ_CONTACTS",
      "RECEIVE_BOOT_COMPLETED",
      "WRITE_EXTERNAL_STORAGE",
      "WAKE_LOCK",
      "USE_FINGERPRINT",
      "USE_BIOMETRIC",
    ],
    intentFilters: [
      {
        action: "VIEW",
        category: ["DEFAULT", "BROWSABLE"],
        data: [{ scheme: scheme }, { scheme: androidPackage }],
      },
      {
        autoVerify: true,
        action: "VIEW",
        category: ["DEFAULT", "BROWSABLE"],
        data: [
          { scheme: "https", host: appDomainGetConverse, pathPrefix: "/dm" },
          { scheme: "https", host: appDomainConverse, pathPrefix: "/dm" },
          {
            scheme: "https",
            host: appDomainGetConverse,
            pathPrefix: "/group-invite",
          },
          {
            scheme: "https",
            host: appDomainConverse,
            pathPrefix: "/group-invite",
          },
          {
            scheme: "https",
            host: appDomainGetConverse,
            pathPrefix: "/group",
          },
          { scheme: "https", host: appDomainConverse, pathPrefix: "/group" },
          {
            scheme: "https",
            host: appDomainGetConverse,
            pathPrefix: "/coinbase",
          },
          {
            scheme: "https",
            host: appDomainConverse,
            pathPrefix: "/coinbase",
          },
          {
            scheme: "https",
            host: appDomainGetConverse,
            pathPrefix: "/desktopconnect",
          },
          {
            scheme: "https",
            host: appDomainConverse,
            pathPrefix: "/desktopconnect",
          },
        ],
      },
    ],
  },
  plugins: [
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 34,
          targetSdkVersion: 34,
          buildToolsVersion: "34.0.0",
          minSdkVersion: 26,
          manifestQueries: {
            package: ["org.toshi"],
            intent: [
              {
                action: "VIEW",
                data: {
                  scheme: "cbwallet",
                  host: "*",
                },
              },
              {
                action: "VIEW",
                data: {
                  scheme: "ledgerlive",
                  host: "*",
                },
              },
              {
                action: "VIEW",
                data: {
                  scheme: "rainbow",
                  host: "*",
                },
              },
              {
                action: "VIEW",
                data: {
                  scheme: "metamask",
                  host: "*",
                },
              },
              {
                action: "VIEW",
                data: {
                  scheme: "trust",
                  host: "*",
                },
              },
              {
                action: "VIEW",
                data: {
                  scheme: "uniswap",
                  host: "*",
                },
              },
              {
                action: "VIEW",
                data: {
                  scheme: "zerion",
                  host: "*",
                },
              },
              {
                action: "VIEW",
                data: {
                  scheme: "exodus",
                  host: "*",
                },
              },
              {
                action: "VIEW",
                data: {
                  scheme: "oneinch",
                  host: "*",
                },
              },
            ],
          },
        },
      },
    ],
    [
      "@sentry/react-native/expo",
      {
        organization: "converse-app",
        project: "converse-react-native",
        url: "https://sentry.io/",
      },
    ],
    ["@react-native-firebase/app-check"],

    "./scripts/build/android/notifeeExpoPlugin.js", // See https://github.com/invertase/notifee/issues/350
    "./scripts/build/android/androidDependenciesExpoPlugin.js", // Handle some conflicting dependencies manually
    "./scripts/build/android/buildGradleProperties.js", // Increase memory for building android in EAS
  ],
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
  },
});
