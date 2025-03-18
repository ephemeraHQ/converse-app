// @ts-nocheck note(lustig) env types aren't working for me OOTB

import Constants from "expo-constants"
import { IConfig, ILoggerColorScheme } from "@/config/config.types"

function maybeReplaceLocalhost(uri: string) {
  try {
    if (uri?.includes("localhost")) {
      console.info("Replacing localhost with device-accessible IP")
      // Try Expo host info first
      const hostIp = Constants.expoConfig?.hostUri?.split(":")[0]
      console.info("Host IP", { hostIp })

      if (hostIp) {
        console.info("Replacing localhost with device-accessible IP", {
          uri,
          hostIp,
        })
        return uri.replace("localhost", hostIp)
      }
    }
  } catch (error) {
    console.error("Error replacing localhost with device-accessible IP", error)
  }

  return uri
}

// Base configuration shared across all environments
export const shared = {
  appName: Constants.expoConfig?.name || "Converse",
  appVersion: Constants.expoConfig?.version || "0.0.0",
  loggerColorScheme: (process.env.EXPO_PUBLIC_LOGGER_COLOR_SCHEME as ILoggerColorScheme) || "light",
  debugMenu: false,
  xmtpEnv: (process.env.EXPO_PUBLIC_XMTP_ENV || "dev") as IConfig["xmtpEnv"],
  apiURI: maybeReplaceLocalhost(process.env.EXPO_PUBLIC_CONVOS_API_URI),
  debugAddresses: process.env.EXPO_PUBLIC_DEBUG_ADDRESSES?.toLowerCase().split(",") || [],
  lensApiDomain: "api.lens.dev",
  lensSuffix: ".lens",
  sentryDSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  framesAllowedSchemes: ["http", "https", "ethereum"],
  privy: {
    appId: process.env.EXPO_PUBLIC_PRIVY_APP_ID,
    clientId: process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID,
  },
  thirdwebClientId: process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID,
  reactQueryEncryptionKey: process.env.EXPO_PUBLIC_SECURE_REACT_QUERY_ENCRYPTION_KEY,
  reactQueryPersistCacheIsEnabled: process.env.EXPO_ENABLE_REACT_QUERY_PERSIST_CACHE === "true",
  appCheckDebugToken:
    Platform.OS === "android"
      ? process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN_ANDROID
      : process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN_IOS,
  xmtp: {
    maxMsUntilLogError: 3000,
  },
} as const satisfies Partial<IConfig>
