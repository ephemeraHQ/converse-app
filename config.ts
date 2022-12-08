import Constants from "expo-constants";

const ENV = {
  dev: {
    xmtpEnv: "dev",
    xmtpWebviewURI: "",
  },
  prod: {
    xmtpEnv: "production",
    xmtpWebviewURI: "https://xmtp-native-webview.vercel.app",
  },
};

const getConfig = (env = Constants.manifest?.releaseChannel) => {
  if (__DEV__) {
    return ENV.dev;
  } else {
    return ENV.prod;
  }
};

export default getConfig();
