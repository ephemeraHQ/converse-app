// @ts-nocheck note(lustig) env types aren't working for me OOTB

import { IConfig, ILoggerColorScheme } from "@/config/config.types";
import Constants from "expo-constants";

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

// Base configuration shared across all environments
export const shared = {
  loggerColorScheme:
    (process.env.EXPO_PUBLIC_LOGGER_COLOR_SCHEME as ILoggerColorScheme) ||
    "light",
  debugMenu: false,
  xmtpEnv: (process.env.EXPO_PUBLIC_XMTP_ENV || "dev") as IConfig["xmtpEnv"],
  apiURI: maybeReplaceLocalhost(process.env.EXPO_PUBLIC_CONVOS_API_URI),
  deprecatedApiURI: maybeReplaceLocalhost(process.env.EXPO_PUBLIC_API_URI),
  debugAddresses:
    process.env.EXPO_PUBLIC_DEBUG_ADDRESSES?.toLowerCase().split(",") || [],
  lensApiDomain: "api.lens.dev",
  lensSuffix: ".lens",
  sentryDSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  framesAllowedSchemes: ["http", "https", "ethereum"],
  walletConnectConfig: {
    projectId: process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID,
    appMetadata: {
      name: "Converse",
      description:
        "Converse lets you communicate and transact freely and safely.",
      url: "https://converse.xyz",
      logoUrl: "https://converse.xyz/icon.png",
      icons: [],
    },
  },
  privy: {
    appId: process.env.EXPO_PUBLIC_PRIVY_APP_ID,
    clientId: process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID,
  },
  thirdwebClientId: process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID,
  reactQueryEncryptionKey:
    // @ts-expect-error todo fixme
    process.env.EXPO_PUBLIC_SECURE_REACT_QUERY_ENCRYPTION_KEY,
} as const satisfies Partial<IConfig>;
