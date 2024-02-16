import Constants from "expo-constants";
import { Platform } from "react-native";
import { baseGoerli, base } from "viem/chains";

const defaultConfig = {
  debugMenu: false,
  polAddress: "0xf9a3BB070c1f9b3186A547DeD991BeD04a289C5B", // polmaire.eth
  debugAddresses: [
    "0xf9a3BB070c1f9b3186A547DeD991BeD04a289C5B", // polmaire.eth
    "0xc50E761C35E731d3A475eeB1e30CB917eDaFE187", // pol.converse.xyz
    "0xd3f4Ab0210235e639290B3E1284198bcE42FaA7D", // 0xno12.converse.xyz
    "0x4496848684441C15A915fa9bF07D131155603253", // No12 first address
    "0x2376e9C7C604D1827bA9aCb1293Dc8b4DA2f0DB3", // 0xno12.eth
    "0xFA08a80e822F7FA002c4Ae81b7a6De7cE79499dB", // lourou.eth
    "0xbAc42d62181A57b59afB9d3E9e607Ef73fa8CeD1", // cvandroid.converse.xyz
  ],
  conversationDomain: "converse.xyz",
  lensApiDomain: "api.lens.dev",
  lensSuffix: ".lens",
  sentryDSN:
    "https://fb7c7cbf876644b68a05db08623c8369@o4504757119680512.ingest.sentry.io/4504757120729088",
  walletConnectConfig: {
    projectId: "e0cc618ee5360e934f51ecd94c702d3f",
    dappMetadata: {
      name: "Converse",
      description:
        "Converse lets you communicate and transact freely and safely.",
      url: "https://converse.xyz",
      logoUrl: "https://converse.xyz/icon.png",
      icons: [],
    },
  },
  thirdwebClientId: "fb80f0aa5ea6c07d74813e56c1ea53e5",
  expoProjectId: "49a65fae-3895-4487-8e8a-5bd8bee3a401",
  privy: {
    appId: "cloh5bn1p00q4l50gcg0g1mix",
    defaultChain: baseGoerli,
  },
  evm: {
    transactionChainId: "0x14a33", // Base Goerli
    USDC: {
      contractAddress: "0x31d3a7711a74b4ec970f50c3eaf1ee47ba803a95", // Base Goerli USDC (NOTfrom doc)
      // contractAddress: "0xf175520c52418dfe19c8098071a252da48cd1c19", // Base Goerli USDC (from doc)
      name: "USD Coin",
      version: "2",
      decimals: 6,
    },
    rpcEndpoint:
      "https://base-goerli.g.alchemy.com/v2/Jl1z46xZWUzMr042dL1D7533XcOvXmb6",
  },
  splitScreenThreshold: 600,
};

const isAndroid = Platform.OS === "android";

const ENV = {
  dev: {
    ...defaultConfig,
    env: "dev",
    xmtpEnv: Constants.expoConfig?.extra?.DEV_XMTP_ENV || "dev",
    apiURI:
      Platform.OS === "web"
        ? "http://localhost:9875"
        : Constants.expoConfig?.extra?.DEV_API_URI || "",
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
    privy: {
      appId: "clpb3fsrl007nlb0fj4ozei9a",
      defaultChain: base,
    },
    evm: {
      transactionChainId: "0x2105", // Base Mainnet
      USDC: {
        contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Native Base USDC
        name: "USD Coin",
        version: "2",
        decimals: 6,
      },
      rpcEndpoint:
        "https://base-mainnet.g.alchemy.com/v2/ZPqjDRWZVyTwdBYPikn1a7iEOCyxMWqX",
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
