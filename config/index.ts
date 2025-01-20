import { Platform } from "react-native";
import { isDev, isPreview } from "../utils/getEnv";
import { devConfig } from "./dev";
import { previewConfig } from "./preview";
import { prodConfig } from "./prod";

export type XmtpEnv = "local" | "dev" | "production";

// Chain-specific configurations
export const chainConfig = {
  sepolia: {
    transactionChainId: "0x14a34", // Base Sepolia
    USDC: {
      contractAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      name: "USDC",
      version: "2",
      decimals: 6,
    },
  },
  mainnet: {
    transactionChainId: "0x2105", // Base Mainnet
    USDC: {
      contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      name: "USD Coin",
      version: "2",
      decimals: 6,
    },
  },
} as const;

export const isAndroid = Platform.OS === "android";

const ENV = {
  dev: devConfig,
  preview: previewConfig,
  prod: prodConfig,
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
