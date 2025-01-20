import { Platform } from "react-native";
import { Environments } from "../utils/getEnv";
import { shared } from "./shared";
import { IConfig } from "@/config/config.types";

export const prodConfig: IConfig = {
  ...shared,
  env: Environments.prod,
  xmtpEnv: "production" as const,
  apiURI: "https://backend-prod.converse.xyz",
  debugMenu: false,
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
  privy: {
    appId: process.env.EXPO_PUBLIC_PRIVY_APP_ID,
    defaultChain: shared,
  },
  evm: {
    rpcEndpoint: process.env.EXPO_PUBLIC_EVM_RPC_ENDPOINT,
    mainnet: {
      transactionChainId: "0x2105", // Base Mainnet
      USDC: {
        contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        name: "USD Coin",
        version: "2",
        decimals: 6,
      },
    },
  },
} as const;
