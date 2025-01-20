import { baseSepolia } from "wagmi/chains";
import { getApiUri } from "../utils/api/api.config";
import { Environments } from "../utils/getEnv";
import { base } from "./base";
import { XmtpEnv, isAndroid, chainConfig } from ".";

export const devConfig = {
  ...base,
  env: Environments.dev,
  xmtpEnv: (process.env.EXPO_PUBLIC_DEV_XMTP_ENV || "dev") as XmtpEnv,
  apiURI: getApiUri(),
  debugMenu: true,
  bundleId: "com.converse.dev",
  appleAppGroup: "group.com.converse.dev",
  scheme: "converse-dev",
  websiteDomain: "dev.converse.xyz",
  usernameSuffix: ".conversedev.eth",
  universalLinks: ["dev.converse.xyz/", "dev.getconverse.app/"].flatMap(
    (domain) => [`https://${domain}`, `http://${domain}`, domain]
  ),
  appCheckDebugToken: isAndroid
    ? process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN_ANDROID
    : process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN_IOS,
  evm: {
    ...chainConfig.sepolia,
    rpcEndpoint: process.env.EXPO_PUBLIC_EVM_RPC_ENDPOINT,
  },
} as const;
