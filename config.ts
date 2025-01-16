import { DEFAULT_SUPPORTED_CHAINS } from "@utils/evm/wallets";
import { Platform } from "react-native";
import { base, baseSepolia } from "wagmi/chains";
import { getApiUri } from "./utils/apiConfig";
import { Environments, isDev, isPreview } from "./utils/getEnv";

type XmtpEnv = "local" | "dev" | "production";

declare const process: {
  env: {
    [key: string]: string;
  };
};

const defaultConfig = {
  debugMenu: false,
  contactAddress: process.env.EXPO_PUBLIC_CONTACT_ADDRESS,
  debugAddresses:
    process.env.EXPO_PUBLIC_DEBUG_ADDRESSES?.toLowerCase().split(",") || [],
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
    optionalChains: DEFAULT_SUPPORTED_CHAINS,
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
  framesAllowedSchemes: ["http", "https", "ethereum"],
};

const isAndroid = Platform.OS === "android";

const apiURI = getApiUri();

const ENV = {
  dev: {
    ...defaultConfig,
    apiURI,
    env: Environments.dev,
    xmtpEnv: (process.env.EXPO_PUBLIC_DEV_XMTP_ENV || "dev") as XmtpEnv,
    debugMenu: true,
    bundleId: "com.converse.dev",
    appleAppGroup: "group.com.converse.dev",
    scheme: "converse-dev",
    websiteDomain: "dev.converse.xyz",
    usernameSuffix: ".conversedev.eth",
    universalLinks: ["dev.converse.xyz/", "dev.getconverse.app/"].flatMap(
      (domain) => [`https://${domain}`, `http://${domain}`, domain]
    ),
    alphaGroupChatUrl:
      "https://converse.xyz/group-invite/UDv3aYZONQGc6_XPJY6Ch",
    appCheckDebugToken: isAndroid
      ? process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN_ANDROID
      : process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN_IOS,
  },
  preview: {
    ...defaultConfig,
    env: Environments.preview,
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
    alphaGroupChatUrl:
      "https://converse.xyz/group-invite/eQAvo-WvwrdBTsHINuSMJ",
    appCheckDebugToken: undefined,
  },
  prod: {
    ...defaultConfig,
    env: Environments.prod,
    xmtpEnv: "production",
    apiURI: "https://backend-prod.converse.xyz",
    debugMenu: false,
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
    alphaGroupChatUrl:
      "https://converse.xyz/group-invite/eQAvo-WvwrdBTsHINuSMJ",
    appCheckDebugToken: undefined,
  },
} as const;

export const getConfig = () => {
  if (isDev) {
    return ENV.dev;
  } else if (isPreview) {
    return ENV.preview;
  } else {
    return ENV.prod;
  }
};

export default getConfig();
