import { IConfig } from "@/config/config.types";
import { Platform } from "react-native";
import { shared } from "./shared";

export const prodConfig: IConfig = {
  ...shared,
  xmtpEnv: "production" as const,
  apiURI: "https://backend-prod.converse.xyz",
  bundleId:
    Platform.OS === "android" ? "com.converse.prod" : "com.converse.native",
  appleAppGroup: "group.com.converse.native",
  scheme: "converse",
  websiteDomain: "converse.xyz",
  usernameSuffix: ".converse.xyz",
  universalLinks: ["converse.xyz/", "getconverse.app/"].flatMap((domain) => [
    `https://${domain}`,
    `http://${domain}`,
    domain,
  ]),
  evm: {
    rpcEndpoint: process.env.EXPO_PUBLIC_EVM_RPC_ENDPOINT,
    transactionChainId: "0x2105", // Base Mainnet
    USDC: {
      contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      name: "USD Coin",
      version: "2",
      decimals: 6,
    },
  },
} as const;
