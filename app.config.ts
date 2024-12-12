import { ConfigContext, ExpoConfig } from "expo/config";
import warnOnce from "warn-once";
import { PluginConfigTypeAndroid } from "expo-build-properties/src/pluginConfig";

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
        } satisfies PluginConfigTypeAndroid,
        ios: {
          deploymentTarget: "13.4",
        },
      },
    ],
    [
      "@sentry/react-native/expo",
      {
        organization: "converse-app",
        project: "converse-react-native",
        url: "https://sentry.io/",
        authToken:
          "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",
      },
    ],
    ["./scripts/build/androidDependenciesExpoPlugin.js"],
  ],
  ios: {
    supportsTablet: true,
    buildNumber: appBuildNumbers.expo.ios.buildNumber,
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FFFFFF",
    },
    versionCode: appBuildNumbers.expo.android.versionCode,
    package: "com.converse.dev",
    googleServicesFile: "./android-google-services.json",
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
        data: [{ scheme: "converse-dev" }, { scheme: "com.converse.dev" }],
      },
      {
        autoVerify: true,
        action: "VIEW",
        category: ["DEFAULT", "BROWSABLE"],
        data: [
          { scheme: "https", host: "dev.getconverse.app", pathPrefix: "/dm" },
          { scheme: "https", host: "dev.converse.xyz", pathPrefix: "/dm" },
          {
            scheme: "https",
            host: "dev.getconverse.app",
            pathPrefix: "/group-invite",
          },
          {
            scheme: "https",
            host: "dev.converse.xyz",
            pathPrefix: "/group-invite",
          },
          {
            scheme: "https",
            host: "dev.getconverse.app",
            pathPrefix: "/group",
          },
          { scheme: "https", host: "dev.converse.xyz", pathPrefix: "/group" },
          {
            scheme: "https",
            host: "dev.getconverse.app",
            pathPrefix: "/coinbase",
          },
          {
            scheme: "https",
            host: "dev.converse.xyz",
            pathPrefix: "/coinbase",
          },
          {
            scheme: "https",
            host: "dev.getconverse.app",
            pathPrefix: "/desktopconnect",
          },
          {
            scheme: "https",
            host: "dev.converse.xyz",
            pathPrefix: "/desktopconnect",
          },
        ],
      },
    ],
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
