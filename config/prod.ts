import { Environments } from "../utils/getEnv";
import { base } from "./base";
import { isAndroid, chainConfig } from ".";

export const prodConfig = {
  ...base,
  env: Environments.prod,
  xmtpEnv: "production" as const,
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
    ...chainConfig.mainnet,
    rpcEndpoint: process.env.EXPO_PUBLIC_EVM_RPC_ENDPOINT,
  },
} as const;
