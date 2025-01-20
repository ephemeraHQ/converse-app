import { baseSepolia } from "wagmi/chains";
import { Environments } from "../utils/getEnv";
import { base } from "./base";
import { chainConfig } from ".";

export const previewConfig = {
  ...base,
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
    ...chainConfig.sepolia,
    rpcEndpoint: process.env.EXPO_PUBLIC_EVM_RPC_ENDPOINT,
  },
} as const;
