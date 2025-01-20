import { IConfig } from "@/config/config.types";
import { IXmtpEnv } from "@/utils/xmtpRN/xmtp.types";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { baseSepolia } from "wagmi/chains";
import { shared } from "./shared";

function maybeReplaceLocalhost(uri: string) {
  try {
    if (uri?.includes("localhost")) {
      console.info("Replacing localhost with device-accessible IP");
      // Try Expo host info first
      const hostIp = Constants.expoConfig?.hostUri?.split(":")[0];
      console.info("Host IP", { hostIp });

      if (hostIp) {
        console.info("Replacing localhost with device-accessible IP", {
          uri,
          hostIp,
        });
        return uri.replace("localhost", hostIp);
      }
    }
  } catch (error) {
    console.error("Error replacing localhost with device-accessible IP", error);
  }

  return uri;
}

export const devConfig: IConfig = {
  ...shared,
  xmtpEnv: (process.env.EXPO_PUBLIC_DEV_XMTP_ENV || "dev") as IXmtpEnv,
  apiURI: maybeReplaceLocalhost(process.env.EXPO_PUBLIC_DEV_API_URI),
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
  privy: {
    appId: process.env.EXPO_PUBLIC_PRIVY_APP_ID,
    defaultChain: baseSepolia,
  },
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
