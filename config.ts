import Constants from "expo-constants";

const defaultConfig = {
  showDebug: false,
};

const ENV = {
  dev: {
    ...defaultConfig,
    xmtpEnv: "dev",
    xmtpWebviewURI:
      "https://xmtp-native-webview-ke6ucex4w-noemalzieu-web3.vercel.app",
    notificationsServerURI: "http://noe-mbp.local:9875",
    showDebug: true,
  },
  preview: {
    ...defaultConfig,
    xmtpEnv: "dev",
    xmtpWebviewURI:
      "https://xmtp-native-webview-1jiq3bphg-noemalzieu-web3.vercel.app",
    notificationsServerURI: "https://xmtp-notifications-preview.fly.dev",
    showDebug: true,
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
