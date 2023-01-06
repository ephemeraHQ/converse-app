import Constants from "expo-constants";

const defaultConfig = {
  debugMenu: false,
  polAddress: "0xf9a3BB070c1f9b3186A547DeD991BeD04a289C5B",
  conversationDomain: "getconverse.app",
};

const ENV = {
  dev: {
    ...defaultConfig,
    xmtpEnv: "dev",
    xmtpWebviewURI: "https://xmtp-native-webview.vercel.app",
    notificationsServerURI: "http://noe-mbp.local:9875",
    debugMenu: true,
  },
  preview: {
    ...defaultConfig,
    xmtpEnv: "dev",
    xmtpWebviewURI: "https://xmtp-native-webview.vercel.app",
    notificationsServerURI: "https://xmtp-notifications-preview.fly.dev",
    debugMenu: true,
  },
  prod: {
    ...defaultConfig,
    xmtpEnv: "production",
    xmtpWebviewURI: "https://xmtp-native-webview.vercel.app",
    notificationsServerURI: "https://xmtp-notifications.fly.dev",
  },
};

const getConfig = () => {
  if (__DEV__) {
    return ENV.dev;
  } else if (Constants.expoConfig?.extra?.ENV === "preview") {
    return ENV.preview;
  } else {
    return ENV.prod;
  }
};

export default getConfig();
