import { IConfig, ILoggerColorScheme } from "@/config/config.types";

// Base configuration shared across all environments
export const shared = {
  loggerColorScheme:
    (process.env.EXPO_PUBLIC_LOGGER_COLOR_SCHEME as ILoggerColorScheme) ||
    "light",
  debugMenu: false,
  debugAddresses:
    process.env.EXPO_PUBLIC_DEBUG_ADDRESSES?.toLowerCase().split(",") || [],
  lensApiDomain: "api.lens.dev",
  lensSuffix: ".lens",
  sentryDSN:
    "https://fb7c7cbf876644b68a05db08623c8369@o4504757119680512.ingest.sentry.io/4504757120729088",
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
} satisfies Partial<IConfig>;
