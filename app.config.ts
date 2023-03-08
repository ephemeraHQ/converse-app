import appBuildNumbers from "./app.json";

const env = process.env as any;
const isDev = env.EXPO_ENV === "dev";
const isPreview = env.EXPO_ENV === "preview";
const isProduction = !isDev && !isPreview;

export default {
  name: isDev ? "Converse DEV" : isPreview ? "Converse PREVIEW" : "Converse",
  scheme: isDev ? "converse-dev" : isPreview ? "converse-preview" : "converse",
  slug: "converse",
  version: "1.0.0",
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
  assetBundlePatterns: ["**/*"],
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
    googleServicesFile: "./google-services.json",
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  extra: {
    eas: {
      projectId: "49a65fae-3895-4487-8e8a-5bd8bee3a401",
    },
    ENV: isDev ? "dev" : isPreview ? "preview" : "prod",
  },
  runtimeVersion: "exposdk:48.0.0",
  owner: "noemalzieu",
  jsEngine: "hermes",
  plugins: ["sentry-expo"],
  hooks: {
    postPublish: [
      {
        file: "sentry-expo/upload-sourcemaps",
        config: {
          organization: "converse-app",
          project: "converse-react-native",
          authToken:
            "eac2788f667c4e35b610e664417b0acd1d2c43fd8ab2458986cfe85a96cf940a",
        },
      },
    ],
  },
};
