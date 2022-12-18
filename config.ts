import Constants from "expo-constants";

const ENV = {
  dev: {
    xmtpEnv: "dev",
    xmtpWebviewURI:
      "https://85ef-2a01-cb04-85e-2800-6957-1668-616f-9dd9.eu.ngrok.io",
    notificationsServerURI: "http://noe-mbp.local:9875",
  },
  preview: {
    xmtpEnv: "dev",
    xmtpWebviewURI: "https://xmtp-native-webview.vercel.app",
    notificationsServerURI: "https://xmtp-notifications-preview.fly.dev",
  },
  prod: {
    xmtpEnv: "production",
    xmtpWebviewURI: "https://xmtp-native-webview.vercel.app",
    notificationsServerURI: "https://xmtp-notifications.fly.dev",
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
