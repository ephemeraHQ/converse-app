## SpecStory

## Refactoring Configuration for Clarity (1/19/2025, 7:25:33 AM)

_**User**_

make cleaner

---

_**Assistant**_

I'll help make this configuration file cleaner and more maintainable. Here are the suggested improvements:

```typescript:config.ts
// ... existing code ...

// Base configuration shared across all environments
const baseConfig = {
  debugMenu: false,
  contactAddress: process.env.EXPO_PUBLIC_CONTACT_ADDRESS,
  debugAddresses:
    process.env.EXPO_PUBLIC_DEBUG_ADDRESSES?.toLowerCase().split(",") || [],
  conversationDomain: "converse.xyz",
  lensApiDomain: "api.lens.dev",
  lensSuffix: ".lens",
  sentryDSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  splitScreenThreshold: 600,
  framesAllowedSchemes: ["http", "https", "ethereum"],
  walletConnectConfig: {
    projectId: process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID,
    appMetadata: {
      name: "Converse",
      description: "Converse lets you communicate and transact freely and safely.",
      url: "https://converse.xyz",
      logoUrl: "https://converse.xyz/icon.png",
      icons: [],
    },
    optionalChains: DEFAULT_SUPPORTED_CHAINS,
  },
  thirdwebClientId: process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID,
  expoProjectId: process.env.EXPO_PUBLIC_EXPO_PROJECT_ID,
} as const;

// Chain-specific configurations
const chainConfig = {
  sepolia: {
    transactionChainId: "0x14a34", // Base Sepolia
    USDC: {
      contractAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      name: "USDC",
      version: "2",
      decimals: 6,
    },
  },
  mainnet: {
    transactionChainId: "0x2105", // Base Mainnet
    USDC: {
      contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      name: "USD Coin",
      version: "2",
      decimals: 6,
    },
  },
} as const;

// Environment-specific configurations
const ENV = {
  dev: {
    ...baseConfig,
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
    alphaGroupChatUrl: "https://converse.xyz/group-invite/UDv3aYZONQGc6_XPJY6Ch",
    appCheckDebugToken: isAndroid
      ? process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN_ANDROID
      : process.env.EXPO_PUBLIC_FIREBASE_APP_CHECK_DEBUG_TOKEN_IOS,
    privy: {
      appId: process.env.EXPO_PUBLIC_PRIVY_APP_ID,
      defaultChain: baseSepolia,
    },
    evm: {
      ...chainConfig.sepolia,
      rpcEndpoint: process.env.EXPO_PUBLIC_EVM_RPC_ENDPOINT,
    },
  },
  preview: {
    ...baseConfig,
    env: Environments.preview,
    xmtpEnv: "dev" as const,
    apiURI: "https://backend-staging.converse.xyz",
    debugMenu: true,
    bundleId: "com.converse.preview",
    appleAppGroup: "group.com.converse.preview",
    scheme: "converse-preview",
    websiteDomain: "preview.converse.xyz",
    usernameSuffix: ".conversedev.eth",
    universalLinks: [
      "preview.converse.xyz/",
      "preview.getconverse.app/",
    ].flatMap((domain) => [`https://${domain}`, `http://${domain}`, domain]),
    alphaGroupChatUrl: "https://converse.xyz/group-invite/eQAvo-WvwrdBTsHINuSMJ",
    privy: {
      appId: process.env.EXPO_PUBLIC_PRIVY_APP_ID,
      defaultChain: baseSepolia,
    },
    evm: {
      ...chainConfig.sepolia,
      rpcEndpoint: process.env.EXPO_PUBLIC_EVM_RPC_ENDPOINT,
    },
  },
  prod: {
    ...baseConfig,
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
    alphaGroupChatUrl: "https://converse.xyz/group-invite/eQAvo-WvwrdBTsHINuSMJ",
    privy: {
      appId: process.env.EXPO_PUBLIC_PRIVY_APP_ID,
      defaultChain: base,
    },
    evm: {
      ...chainConfig.mainnet,
      rpcEndpoint: process.env.EXPO_PUBLIC_EVM_RPC_ENDPOINT,
    },
  },
} as const;

// ... existing code ...
```

Key improvements made:

1. Extracted shared configuration into `baseConfig`
2. Created separate `chainConfig` for Base Sepolia and Base Mainnet configurations
3. Removed `defaultConfig` and used `baseConfig` instead
4. Used the spread operator to merge chain configurations
5. Added `as const` assertions for better type inference
6. Organized the code into logical sections with comments
7. Removed duplicate USDC and chain configurations
8. Maintained the same functionality while reducing code duplication

The rest of the file (imports and exports) can remain unchanged.

---



---

