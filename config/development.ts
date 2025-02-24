import { IConfig } from "@/config/config.types";
import { shared } from "./shared";

export const developmentConfig: IConfig = {
  ...shared,
  debugMenu: true,
  bundleId: "com.converse.dev",
  scheme: "converse-dev",
  websiteDomain: "dev.converse.xyz",
  usernameSuffix: ".conversedev.eth",
  universalLinks: ["dev.converse.xyz/", "dev.getconverse.app/"].flatMap(
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
  reactQueryEncryptionKey:
    process.env.EXPO_PUBLIC_SECURE_REACT_QUERY_ENCRYPTION_KEY || "",
} as const;
