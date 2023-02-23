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
  infuraApiKey: "38f59a7bbbca49f18046ff3a4a752e1c",
};

const ENV = {
  dev: {
    ...defaultConfig,
    xmtpEnv: "dev",
    xmtpWebviewURI: "https://xmtp-native-webview.vercel.app",
    apiURI: "http://noe-mbp.local:9875",
    debugMenu: true,
    bundleId: "com.converse.dev",
    scheme: "converse-dev",
    lensApiDomain: "api-mumbai.lens.dev",
    ethereumNetwork: "goerli",
    lensSuffix: ".test",
  },
  preview: {
    ...defaultConfig,
    xmtpEnv: "dev",
    xmtpWebviewURI: "https://xmtp-native-webview.vercel.app",
    apiURI: "https://xmtp-notifications-preview.fly.dev",
    debugMenu: true,
    bundleId: "com.converse.preview",
    scheme: "converse-preview",
    lensApiDomain: "api-mumbai.lens.dev",
    ethereumNetwork: "goerli",
    lensSuffix: ".test",
  },
  prod: {
    ...defaultConfig,
    xmtpEnv: "production",
    xmtpWebviewURI: "https://xmtp-native-webview.vercel.app",
    apiURI: "https://xmtp-notifications.fly.dev",
    bundleId: "com.converse.native",
    scheme: "converse",
    lensApiDomain: "api.lens.dev",
    ethereumNetwork: "mainnet",
    lensSuffix: ".lens",
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
