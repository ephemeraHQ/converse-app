export default ({ config }) => ({
  name: process.env.PRODUCTION ? "Converse" : "Converse PREVIEW",
  scheme: process.env.PRODUCTION ? "converse" : "converse-preview",
  slug: "converse",
  version: "1.0.0",
  orientation: "portrait",
  icon: process.env.PRODUCTION
    ? "./assets/icon.png"
    : "./assets/icon-preview.png",
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
    bundleIdentifier: process.env.PRODUCTION
      ? "com.converse.native"
      : "com.converse.preview",
    buildNumber: config.expo.ios.buildNumber,
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
  },
  runtimeVersion: {
    policy: "sdkVersion",
  },
  owner: "noemalzieu",
});
