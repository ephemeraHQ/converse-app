import { IConfig } from "@/config/config.types";
import { Environments } from "../utils/getEnv";
import { shared } from "./shared";

export const previewConfig: IConfig = {
  ...shared,
  xmtpEnv: "dev" as const,
  apiURI: "https://backend-staging.converse.xyz",
  debugMenu: true,
  bundleId: "com.converse.preview",
  appleAppGroup: "group.com.converse.preview",
  scheme: "converse-preview",
  websiteDomain: "preview.converse.xyz",
  usernameSuffix: ".conversedev.eth",
  universalLinks: ["preview.converse.xyz/", "preview.getconverse.app/"].flatMap(
    (domain) => [`https://${domain}`, `http://${domain}`, domain]
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
