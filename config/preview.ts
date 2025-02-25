import { Platform } from "react-native";
import { IConfig } from "@/config/config.types";
import { shared } from "./shared";

export const previewConfig: IConfig = {
  ...shared,
  debugMenu: true,
  appStoreUrl: Platform.select({
    default: "itms-beta://testflight.apple.com/v1/app/6478027666",
    android: "https://play.google.com/apps/internaltest/4701737988037557150",
  }),
  bundleId: "com.converse.preview",
  scheme: "converse-preview",
  websiteDomain: "preview.converse.xyz",
  usernameSuffix: ".conversedev.eth",
  universalLinks: ["preview.converse.xyz/", "preview.getconverse.app/"].flatMap(
    (domain) => [`https://${domain}`, `http://${domain}`, domain],
  ),
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
