import appBuildNumbers from "./app.json";

const env = process.env as any;
const isProduction = !env.PREVIEW;

export default {
  slug: "converse",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
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
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  extra: {
    eas: {
      projectId: "49a65fae-3895-4487-8e8a-5bd8bee3a401",
    },
    ENV: isProduction ? "prod" : "preview",
  },
  runtimeVersion: {
    policy: "sdkVersion",
  },
  owner: "noemalzieu",
};
