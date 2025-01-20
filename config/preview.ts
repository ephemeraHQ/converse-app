import { baseSepolia } from "wagmi/chains";
import { Environments } from "../utils/getEnv";
import { shared } from "./shared";
import { IConfig } from "@/config/config.types";

export const previewConfig: IConfig = {
  ...shared,
  env: Environments.preview,
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
  alphaGroupChatUrl: "https://converse.xyz/group-invite/eQAvo-WvwrdBTsHINuSMJ",
  privy: {
    appId: process.env.EXPO_PUBLIC_PRIVY_APP_ID,
    defaultChain: baseSepolia,
  },
  evm: {
    sepolia: {
      transactionChainId: "0x14a34", // Base Sepolia
      USDC: {
        contractAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        name: "USDC",
        version: "2",
        decimals: 6,
      },
    },
    rpcEndpoint: process.env.EXPO_PUBLIC_EVM_RPC_ENDPOINT,
  },
} as const;
