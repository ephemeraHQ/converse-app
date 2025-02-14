## SpecStory

## Environment Configuration Separation (1/19/2025, 9:43:49 AM)

_**User**_

separate dev, preview and prod into 3 objects

---

_**Assistant**_

I'll help you separate the environment configurations into three separate objects. Here's how we can restructure the code:

```typescript:config/index.ts
// ... existing code ...

const devConfig = {
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
  alphaGroupChatUrl:
    "https://converse.xyz/group-invite/UDv3aYZONQGc6_XPJY6Ch",
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
} as const;

const previewConfig = {
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
  universalLinks: [
    "preview.converse.xyz/",
    "preview.getconverse.app/",
  ].flatMap((domain) => [`https://${domain}`, `http://${domain}`, domain]),
  alphaGroupChatUrl:
    "https://converse.xyz/group-invite/eQAvo-WvwrdBTsHINuSMJ",
  privy: {
    appId: process.env.EXPO_PUBLIC_PRIVY_APP_ID,
    defaultChain: baseSepolia,
  },
  evm: {
    ...chainConfig.sepolia,
    rpcEndpoint: process.env.EXPO_PUBLIC_EVM_RPC_ENDPOINT,
  },
} as const;

const prodConfig = {
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
  alphaGroupChatUrl:
    "https://converse.xyz/group-invite/eQAvo-WvwrdBTsHINuSMJ",
  privy: {
    appId: process.env.EXPO_PUBLIC_PRIVY_APP_ID,
    defaultChain: base,
  },
  evm: {
    ...chainConfig.mainnet,
    rpcEndpoint: process.env.EXPO_PUBLIC_EVM_RPC_ENDPOINT,
  },
} as const;

const ENV = {
  dev: devConfig,
  preview: previewConfig,
  prod: prodConfig,
} as const;

// ... existing code ...
```

I've separated the environment configurations into three separate const objects: `devConfig`, `previewConfig`, and `prodConfig`. Then, I've created the `ENV` object that references these configurations. This makes the code more modular and easier to maintain. The functionality remains exactly the same, but the structure is now cleaner and each environment's configuration is self-contained.

---



---

