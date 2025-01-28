declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_PRIVY_CLIENT_ID: string;
      EXPO_PUBLIC_EVM_RPC_ENDPOINT: string;
      EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN_ANDROID: string;
      EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN_IOS: string;
      EXPO_PUBLIC_PRIVY_APP_ID: string;
      EXPO_PUBLIC_THIRDWEB_CLIENT_ID: string;
      EXPO_PUBLIC_API_URI: string;
      EXPO_PUBLIC_XMTP_ENV: string;
      EXPO_PUBLIC_LOGGER_COLOR_SCHEME: string;
      EXPO_PUBLIC_SENTRY_DSN: string;
    }
  }
}

export {};
