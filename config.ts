import Constants from "expo-constants";

const ENV = {
  dev: {
    xmtpEnv: "dev",
    xmtpWebviewURI:
      "https://xmtp-native-webview-eqlo7tp4q-noemalzieu-web3.vercel.app",
    notificationsServerURI: "http://noe-mbp.local:9875",
    showDebug: true,
  },
  preview: {
    xmtpEnv: "dev",
    xmtpWebviewURI: "https://xmtp-native-webview.vercel.app",
    notificationsServerURI: "https://xmtp-notifications-preview.fly.dev",
    showDebug: true,
  },
  prod: {
    xmtpEnv: "production",
    xmtpWebviewURI: "https://xmtp-native-webview.vercel.app",
    notificationsServerURI: "https://xmtp-notifications.fly.dev",
    showDebug: false,
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
