declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_ENV: string;
      EXPO_PUBLIC_WDYR: string;
      EXPO_PUBLIC_DEV_API_URI: string;
      EXPO_PUBLIC_DEV_XMTP_ENV: string;
      EXPO_PUBLIC_DEBUG_ADDRESSES: string;
      EXPO_PUBLIC_SENTRY_DSN: string;
      EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID: string;
      EXPO_PUBLIC_THIRDWEB_CLIENT_ID: string;
      EXPO_PUBLIC_EXPO_PROJECT_ID: string;
      EXPO_PUBLIC_PRIVY_APP_ID: string;
      EXPO_PUBLIC_EVM_RPC_ENDPOINT: string;
      EXPO_PUBLIC_LOGGER_DEFAULT: string;
      EXPO_PUBLIC_LOGGER_CONNECT_WALLET_SEVERITY: string;
      EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN_IOS: string;
      EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN_ANDROID: string;
      SENTRY_AUTH_TOKEN: string;
    }
  }
}

export {};
