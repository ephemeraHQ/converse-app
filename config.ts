import Constants from "expo-constants";
import { Platform } from "react-native";
import { base, baseSepolia } from "wagmi/chains";

declare const process: {
  env: {
    [key: string]: string;
  };
};

const defaultConfig = {
  debugMenu: false,
  contactAddress: process.env.EXPO_PUBLIC_CONTACT_ADDRESS,
  debugAddresses: process.env.EXPO_PUBLIC_DEBUG_ADDRESSES?.split(",") || [],
  conversationDomain: "converse.xyz",
  lensApiDomain: "api.lens.dev",
  lensSuffix: ".lens",
  sentryDSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  walletConnectConfig: {
    projectId: process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID,
    appMetadata: {
      name: "Converse",
      description:
        "Converse lets you communicate and transact freely and safely.",
      url: "https://converse.xyz",
      logoUrl: "https://converse.xyz/icon.png",
      icons: [],
    },
  },
  thirdwebClientId: process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID,
  expoProjectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID,
  privy: {
    appId: process.env.EXPO_PUBLIC_PRIVY_APP_ID,
    defaultChain: baseSepolia,
  },
  evm: {
    transactionChainId: "0x14a34", // Base Sepolia
    USDC: {
      contractAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia USDC
      name: "USDC",
      version: "2",
      decimals: 6,
    },
    rpcEndpoint: process.env.EXPO_PUBLIC_EVM_RPC_ENDPOINT,
  },
  splitScreenThreshold: 600,
};

const isAndroid = Platform.OS === "android";

const ENV = {
  dev: {
    ...defaultConfig,
    env: "dev",
    xmtpEnv: process.env.EXPO_PUBLIC_DEV_XMTP_ENV || "dev",
    apiURI:
      Platform.OS === "web"
        ? "http://localhost:9875"
        : process.env.EXPO_PUBLIC_DEV_API_URI || "",
    debugMenu: true,
    bundleId: "com.converse.dev",
    appleAppGroup: "group.com.converse.dev",
    scheme: "converse-dev",
    websiteDomain: "dev.converse.xyz",
    usernameSuffix: ".conversedev.eth",
    universalLinks: ["dev.converse.xyz/", "dev.getconverse.app/"].flatMap(
      (domain) => [`https://${domain}`, `http://${domain}`, domain]
    ),
    enableTransactionFrames: true,
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
    enableTransactionFrames: true,
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
      appId: process.env.EXPO_PUBLIC_PRIVY_APP_ID,
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
      rpcEndpoint: process.env.EXPO_PUBLIC_EVM_RPC_ENDPOINT,
    },
    enableTransactionFrames: false,
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
