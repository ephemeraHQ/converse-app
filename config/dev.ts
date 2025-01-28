import { IConfig } from "@/config/config.types";
import { Platform } from "react-native";
import { shared } from "./shared";

export const devConfig: IConfig = {
  ...shared,
  debugMenu: true,
  bundleId: "com.converse.dev",
  appleAppGroup: "group.com.converse.dev",
  scheme: "converse-dev",
  websiteDomain: "dev.converse.xyz",
  usernameSuffix: ".conversedev.eth",
  universalLinks: ["dev.converse.xyz/", "dev.getconverse.app/"].flatMap(
    (domain) => [`https://${domain}`, `http://${domain}`, domain]
  ),
  appCheckDebugToken:
    Platform.OS === "android"
      ? process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN_ANDROID
      : process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN_IOS,
  evm: {
    rpcEndpoint: process.env.EXPO_PUBLIC_EVM_RPC_ENDPOINT,
    transactionChainId: "0x14a34", // Base Sepolia
    USDC: {
      contractAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      name: "USDC",
      version: "2",
      decimals: 6,
    },
  },
} as const;
