## SpecStory

## Reordering Configuration Properties (1/20/2025, 5:35:09 PM)

_**User**_

reorder like @config.types.ts 

---

_**Assistant**_

I'll help reorder the properties in `prod.config.ts` to match the order defined in `config.types.ts`. Here's the edited version:

```typescript:config/prod.ts
// ... existing code ...
export const prodConfig: IConfig = {
  ...shared,
  debugMenu: false,
  debugAddresses: shared.debugAddresses,
  lensApiDomain: shared.lensApiDomain,
  lensSuffix: shared.lensSuffix,
  sentryDSN: shared.sentryDSN,
  framesAllowedSchemes: shared.framesAllowedSchemes,
  walletConnectConfig: shared.walletConnectConfig,
  thirdwebClientId: shared.thirdwebClientId,
  env: Environments.prod,
  xmtpEnv: "production" as const,
  apiURI: "https://backend-prod.converse.xyz",
  bundleId:
    Platform.OS === "android" ? "com.converse.prod" : "com.converse.native",
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
    defaultChain: shared,
  },
  evm: {
    rpcEndpoint: process.env.EXPO_PUBLIC_EVM_RPC_ENDPOINT,
    transactionChainId: "0x2105", // Base Mainnet
    USDC: {
      contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      name: "USD Coin",
      version: "2",
      decimals: 6,
    },
  },
} as const;
```

I've reordered the properties to match the order in `IConfig` type definition:
1. Added missing properties from shared config (debugAddresses, lensApiDomain, etc.)
2. Kept the existing properties but reordered them to match the type definition
3. Maintained the spread operator at the top to ensure shared config is used as the base

The functionality remains exactly the same, but the code is now more organized and follows the structure defined in the types file.

---



---

