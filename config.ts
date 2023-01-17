import Constants from "expo-constants";

const defaultConfig = {
  debugMenu: false,
  polAddress: "0xf9a3BB070c1f9b3186A547DeD991BeD04a289C5B",
  debugAddresses: [
    "0xf9a3BB070c1f9b3186A547DeD991BeD04a289C5B",
    "0x4496848684441C15A915fa9bF07D131155603253",
    "0x2376e9C7C604D1827bA9aCb1293Dc8b4DA2f0DB3",
  ],
  conversationDomain: "getconverse.app",
};

const ENV = {
  dev: {
    ...defaultConfig,
    xmtpEnv: "dev",
    xmtpWebviewURI: "https://xmtp-native-webview.vercel.app",
    apiURI: "http://noe-mbp.local:9875",
    debugMenu: true,
  },
  preview: {
    ...defaultConfig,
    xmtpEnv: "dev",
    xmtpWebviewURI: "https://xmtp-native-webview.vercel.app",
    apiURI: "https://xmtp-notifications-preview.fly.dev",
    debugMenu: true,
  },
  prod: {
    ...defaultConfig,
    xmtpEnv: "production",
    xmtpWebviewURI: "https://xmtp-native-webview.vercel.app",
    apiURI: "https://xmtp-notifications.fly.dev",
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
