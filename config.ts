import Constants from "expo-constants";
import { Platform } from "react-native";

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
  lensApiDomain: "api.lens.dev",
  lensSuffix: ".lens",
  sentryDSN:
    "https://fb7c7cbf876644b68a05db08623c8369@o4504757119680512.ingest.sentry.io/4504757120729088",
};

const isAndroid = Platform.OS === "android";

const ENV = {
  dev: {
    ...defaultConfig,
    env: "dev",
    xmtpEnv: "dev",
    apiURI: "http://noe-mbp.local:9875",
    debugMenu: true,
    bundleId: "com.converse.dev",
    scheme: "converse-dev",
    websiteDomain: "dev.getconverse.app",
    universalLinks: ["dev.converse.xyz/", "dev.getconverse.app/"].flatMap(
      (domain) => [`https://${domain}`, `http://${domain}`, domain]
    ),
  },
  preview: {
    ...defaultConfig,
    env: "preview",
    xmtpEnv: "dev",
    apiURI: "https://backend-staging.converse.xyz",
    debugMenu: true,
    bundleId: "com.converse.preview",
    scheme: "converse-preview",
    websiteDomain: "preview.getconverse.app",
    universalLinks: [
      "preview.converse.xyz/",
      "preview.getconverse.app/",
    ].flatMap((domain) => [`https://${domain}`, `http://${domain}`, domain]),
  },
  prod: {
    ...defaultConfig,
    env: "prod",
    xmtpEnv: "production",
    apiURI: "https://backend-prod.converse.xyz",
    bundleId: isAndroid ? "com.converse.prod" : "com.converse.native",
    scheme: "converse",
    websiteDomain: "getconverse.app",
    universalLinks: ["converse.xyz/", "getconverse.app/"].flatMap((domain) => [
      `https://${domain}`,
      `http://${domain}`,
      domain,
    ]),
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
