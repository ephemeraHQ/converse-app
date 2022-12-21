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
    showDebug: false,
  },
  prod: {
    xmtpEnv: "production",
    xmtpWebviewURI: "https://xmtp-native-webview.vercel.app",
    notificationsServerURI: "https://xmtp-notifications.fly.dev",
    showDebug: false,
  },
};

const getConfig = (env = Constants.manifest?.releaseChannel) => {
  if (__DEV__) {
    return ENV.dev;
  } else if (env === "production") {
    return ENV.prod;
  } else {
    return ENV.preview;
  }
};

export default getConfig();
