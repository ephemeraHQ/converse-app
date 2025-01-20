import { ConfigContext, ExpoConfig } from "expo/config";
import warnOnce from "warn-once";
// Removed this import as it was causing a build error
// import type { PluginConfigTypeAndroid } from "expo-build-properties/src/pluginConfig";

import appBuildNumbers from "./app.json";

const env = process.env as any;
const isDev = env.EXPO_ENV === "dev";

const mmkvVersion = "1.3.3";
const xmtpVersion = "3.0.23";

warnOnce(
  isDev && !(process.env as any).EXPO_PUBLIC_DEV_API_URI,
  "\n\n🚧 Running the app without EXPO_PUBLIC_DEV_API_URI setup\n\n"
);

const isPreview = env.EXPO_ENV === "preview";
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
  ? "preview.getconverse.app"
  : "getconverse.app";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: isDev ? "Converse DEV" : isPreview ? "Converse PREVIEW" : "Converse",
  scheme: isDev ? "converse-dev" : isPreview ? "converse-preview" : "converse",
  slug: "converse",
  orientation: "portrait",
  icon: isProduction ? "./assets/icon.png" : "./assets/icon-preview.png",
  userInterfaceStyle: "automatic",
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
    ENV: isDev ? "dev" : isPreview ? "preview" : "prod",
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
    bundleIdentifier: "com.converse.dev",
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
          compileSdkVersion: 35,
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
        ios: {
          deploymentTarget: "15.1",
          extraPods: [
            {
              name: "MMKV",
              version: mmkvVersion,
            },
            {
              name: "MMKVCore",
              version: mmkvVersion,
            },
            {
              name: "XMTP",
              version: xmtpVersion,
              modular_headers: true,
            },
          ],
          entitlements: {
            "com.apple.developer.associated-domains": [
              `applinks:${appDomainConverse}`,
              `applinks:${appDomainGetConverse}`,
            ],
            "com.apple.developer.devicecheck.appattest-environment":
              "production",
            "com.apple.developer.usernotifications.communication": true,
            "com.apple.security.application-groups": [
              `group.com.converse.${
                isDev ? "dev" : isPreview ? "preview" : "prod"
              }`,
            ],
            "keychain-access-groups": [
              `$(AppIdentifierPrefix)com.converse.${
                isDev ? "dev" : isPreview ? "preview" : "prod"
              }`,
            ],
          },
        },
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/splash.png",
        backgroundColor: "#ffffff",
        dark: {
          image: "./assets/splash-dark.png",
          backgroundColor: "#000000",
        },
        imageWidth: 300,
      },
    ],
    "expo-secure-store",
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
