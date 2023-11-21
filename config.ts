import Constants from "expo-constants";
import { Platform } from "react-native";

const defaultConfig = {
  debugMenu: false,
  polAddress: "0xf9a3BB070c1f9b3186A547DeD991BeD04a289C5B",
  debugAddresses: [
    "0xf9a3BB070c1f9b3186A547DeD991BeD04a289C5B",
    "0x4496848684441C15A915fa9bF07D131155603253",
    "0x2376e9C7C604D1827bA9aCb1293Dc8b4DA2f0DB3",
    "0xFA08a80e822F7FA002c4Ae81b7a6De7cE79499dB",
  ],
  conversationDomain: "converse.xyz",
  infuraApiKey: "38f59a7bbbca49f18046ff3a4a752e1c",
  lensApiDomain: "api.lens.dev",
  lensSuffix: ".lens",
  sentryDSN:
    "https://fb7c7cbf876644b68a05db08623c8369@o4504757119680512.ingest.sentry.io/4504757120729088",
  walletConnectConfig: {
    projectId: "e0cc618ee5360e934f51ecd94c702d3f",
    dappMetadata: {
      name: "Converse",
      description:
        "Converse connects web3 identities with each other via messaging.",
      url: "https://converse.xyz",
      logoUrl: "https://converse.xyz/icon.png",
    },
  },
  thirdwebClientId: "fb80f0aa5ea6c07d74813e56c1ea53e5",
  expoProjectId: "49a65fae-3895-4487-8e8a-5bd8bee3a401",
  web3StorageToken:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDBBOTAxOTI0ZTE1NzNhM2RCYzhjNDk3YzlmQ0Q1QzAwZmU3NDAyQUEiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2ODc4MDU0MTUxMDYsIm5hbWUiOiJDb252ZXJzZSBUZXN0In0.5ItNFvSEsXpv4NYG1Uwbw9mL5dVzNQeXefOkjQht3ns",
  privyAppId: "cloh5bn1p00q4l50gcg0g1mix",
  evm: {
    transactionChainId: "0x13881", // Polygon Mumbai
    USDC: {
      contractAddress: "0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747", // Polygon Mumbai USDC
      name: "Mumbai USD Coin",
      version: "2",
    },
  },
};

const isAndroid = Platform.OS === "android";

const ENV = {
  dev: {
    ...defaultConfig,
    env: "dev",
    xmtpEnv: Constants.expoConfig?.extra?.DEV_XMTP_ENV || "dev",
    apiURI: Constants.expoConfig?.extra?.DEV_API_URI || "",
    debugMenu: true,
    bundleId: "com.converse.dev",
    appleAppGroup: "group.com.converse.dev",
    scheme: "converse-dev",
    websiteDomain: "dev.converse.xyz",
    usernameSuffix: ".conversedev.eth",
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
    appleAppGroup: "group.com.converse.preview",
    scheme: "converse-preview",
    websiteDomain: "preview.converse.xyz",
    usernameSuffix: ".conversedev.eth",
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
    appleAppGroup: "group.com.converse.native",
    scheme: "converse",
    websiteDomain: "converse.xyz",
    usernameSuffix: ".converse.xyz",
    universalLinks: ["converse.xyz/", "getconverse.app/"].flatMap((domain) => [
      `https://${domain}`,
      `http://${domain}`,
      domain,
    ]),
    web3StorageToken:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGViMWU0NEJhYjU2MjYzYkI5Njk1OTVmYTk2RjU2MjRBOTUxRmJiNjUiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2ODc4MDQ1ODIyMzMsIm5hbWUiOiJDb252ZXJzZSBBcHAifQ.S4FsNKkmFqp1OWhsxxauUTw82pKqCG3UXEjEYi1xvPM",
    evm: {
      transactionChainId: "0x89", // Polygon Prod
      USDC: {
        contractAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // Native Polygon Prod USDC (or Bridged 0x2791bca1f2de4661ed88a30c99a7a9449aa84174)
        name: "Mumbai USD Coin",
        version: "2", // Probably 1 for 0x2791bca1f2de4661ed88a30c99a7a9449aa84174
      },
    },
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
