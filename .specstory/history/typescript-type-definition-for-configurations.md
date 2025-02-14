## SpecStory

## TypeScript Type Definition for Configurations (1/19/2025, 8:08:01 PM)

_**User**_

create a type based on the properties you see in @shared.ts  and @prod.ts  and @preview.ts  and @dev.ts 

---

_**Assistant**_

I'll help create a comprehensive type definition based on all the config files. I'll create it with proper TypeScript types and include all the properties from the shared and environment-specific configs.

```typescript:config/config.types.ts
type IXmtpEnv = "production" | "dev"

type IWalletConnectConfig = {
  projectId: string | undefined
  appMetadata: {
    name: string
    description: string
    url: string
    logoUrl: string
    icons: string[]
  }
  optionalChains: number[]
}

type IEvmConfig = {
  rpcEndpoint: string | undefined
  mainnet?: {
    transactionChainId: string
    USDC: {
      contractAddress: string
      name: string
      version: string
      decimals: number
    }
  }
  sepolia?: {
    transactionChainId: string
    USDC: {
      contractAddress: string
      name: string
      version: string
      decimals: number
    }
  }
}

type IPrivyConfig = {
  appId: string | undefined
  defaultChain: any // Using 'any' here since the chain type comes from external lib
}

export type IConfig = {
  debugMenu: boolean
  debugAddresses: string[]
  lensApiDomain: string
  lensSuffix: string
  sentryDSN: string | undefined
  framesAllowedSchemes: string[]
  walletConnectConfig: IWalletConnectConfig
  thirdwebClientId: string | undefined
  env: string
  xmtpEnv: IXmtpEnv
  apiURI: string
  bundleId: string
  appleAppGroup: string
  scheme: string
  websiteDomain: string
  usernameSuffix: string
  universalLinks: string[]
  privy: IPrivyConfig
  evm: IEvmConfig
  appCheckDebugToken?: string | undefined
  alphaGroupChatUrl?: string
}
```

This type definition:
1. Captures all shared properties from `shared.ts`
2. Includes all environment-specific properties from `dev.ts`, `prod.ts`, and `preview.ts`
3. Uses proper TypeScript types and makes optional properties that only appear in some environments
4. Breaks down complex nested objects into separate interfaces for better organization
5. Handles the different EVM configurations for mainnet and sepolia
6. Makes properties optional (with ?) if they only appear in some config files

Note that I've added `IXmtpEnv` as a union type since it's specifically typed in the configs. For the chain type in `IPrivyConfig`, you might want to import the proper type from your wagmi dependency if you need more specific typing.

---

_**User**_

For the code present, we get this error:
```
A mapped type may not declare properties or methods.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error occurs because we're mixing a mapped type with a regular property. Here's the fix:

```typescript:config/config.types.ts
// ... existing code ...
type IEvmConfig = {
  rpcEndpoint: string | undefined;
} & {
  [key in IEvm]?: {
    transactionChainId: string;
    USDC: {
      contractAddress: string;
      name: string;
      version: string;
      decimals: number;
    };
  };
};
// ... existing code ...
```

The fix uses an intersection type (`&`) to combine the regular property with the mapped type. This is a valid TypeScript pattern for combining fixed and dynamic properties.

---

_**User**_

For the code present, we get this error:
```
Type '{ readonly env: "prod"; readonly xmtpEnv: "production"; readonly apiURI: "https://backend-prod.converse.xyz"; readonly debugMenu: false; readonly bundleId: "com.converse.native" | "com.converse.prod"; ... 13 more ...; readonly thirdwebClientId: string; }' is not assignable to type 'IConfig'.
  Types of property 'framesAllowedSchemes' are incompatible.
    The type 'readonly ["http", "https", "ethereum"]' is 'readonly' and cannot be assigned to the mutable type '("http" | "https" | "ethereum")[]'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The issue is with readonly arrays. Let's update the type to handle the `as const` assertions in the configs:

```typescript:config/config.types.ts
// ... existing code ...
type IConfig = {
  // ... other properties ...
  framesAllowedSchemes: readonly ("http" | "https" | "ethereum")[]
  // ... other properties ...
}
// ... existing code ...
```

This change makes the array property accept readonly arrays, which matches the `as const` assertion used in the configs.

---

_**User**_

So I have @shared.ts that have "framesAllowedSchemes: ["http", "https", "ethereum"] as const," but then i need to spread the base object in prodConfig @prodConfig but it gives an error because it says that it's readyonly...

---

_**Assistant**_



Since you're spreading `shared` into configs and using `as const`, we need to make the base `shared` object's type match the final config. Here's how to fix it:

```typescript:config/shared.ts
import { DEFAULT_SUPPORTED_CHAINS } from "@utils/evm/wallets";

// Base configuration shared across all environments
export const shared = {
  debugMenu: false,
  debugAddresses:
    process.env.EXPO_PUBLIC_DEBUG_ADDRESSES?.toLowerCase().split(",") || [],
  lensApiDomain: "api.lens.dev",
  lensSuffix: ".lens",
  sentryDSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  framesAllowedSchemes: ["http", "https", "ethereum"],  // Remove 'as const'
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
    optionalChains: DEFAULT_SUPPORTED_CHAINS,
  },
  thirdwebClientId: process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID,
} as const;
```

Remove the `as const` from the `framesAllowedSchemes` array but keep it for the entire object. This allows the array to be mutable while maintaining type safety for the values.

---

_**User**_

but same thing no? in @prod.ts  i still have the typescript error for readonly

---

_**Assistant**_

Ah, I see the issue now. Since we want to keep `as const` on the shared object, we need to modify the `IConfig` type to accept readonly properties. Here's the fix:

```typescript:config/config.types.ts
type IConfig = Readonly<{  // Make the entire config type readonly
  // ... other properties ...
  framesAllowedSchemes: readonly string[]
  // ... other properties ...
}>
```

This change makes the entire config type readonly, which will match the `as const` assertions in both `shared` and the environment configs. The `Readonly<>` utility type ensures all properties are treated as readonly, solving the type mismatch.

---

_**User**_

but is there anoyher way to make it cleaner? I don't want to play with readonly stuff

---

_**Assistant**_



Yes, the cleanest solution would be to remove the `as const` assertion from `shared.ts` since it's causing the readonly issues:

```typescript:config/shared.ts
import { DEFAULT_SUPPORTED_CHAINS } from "@utils/evm/wallets";

// Base configuration shared across all environments
export const shared = {
  debugMenu: false,
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
    optionalChains: DEFAULT_SUPPORTED_CHAINS,
  },
  thirdwebClientId: process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID,
};  // Remove 'as const'
```

This is simpler and will work with the regular mutable types in `IConfig`. The type safety is still maintained through the `IConfig` interface.

---

_**User**_

For the code present, we get this error:
```
Type 'Readonly<ChainOptions & { rpc: string; }>[]' is not assignable to type 'number[]'.
  Type 'Readonly<ChainOptions & { rpc: string; }>' is not assignable to type 'number'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_



The error is due to a type mismatch with `DEFAULT_SUPPORTED_CHAINS`. Update the type in `IConfig` to match the chain type:

```typescript:config/config.types.ts
import { ChainOptions } from "wagmi/chains";  // Import the correct type

type IWalletConnectConfig = {
  projectId: string | undefined;
  appMetadata: {
    name: string;
    description: string;
    url: string;
    logoUrl: string;
    icons: string[];
  };
  optionalChains: Readonly<(ChainOptions & { rpc: string })>[];
};
```

This updates the type to match what `DEFAULT_SUPPORTED_CHAINS` actually returns.

---

_**User**_

For the code present, we get this error:
```
Type '{ readonly env: "prod"; readonly xmtpEnv: "production"; readonly apiURI: "https://backend-prod.converse.xyz"; readonly debugMenu: false; readonly bundleId: "com.converse.native" | "com.converse.prod"; ... 14 more ...; readonly appCheckDebugToken?: string | undefined; }' is not assignable to type 'IConfig'.
  Types of property 'debugAddresses' are incompatible.
    Type 'string[] | undefined' is not assignable to type 'string[]'.
      Type 'undefined' is not assignable to type 'string[]'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_



The issue is with the optional type in `debugAddresses`. Let's ensure it always returns an array in `shared.ts`:

```typescript:config/shared.ts
export const shared: Partial<IConfig> = {
  // ... other properties ...
  debugAddresses: process.env.EXPO_PUBLIC_DEBUG_ADDRESSES?.toLowerCase().split(",").filter(Boolean) || [],
  // ... other properties ...
};
```

Adding `.filter(Boolean)` ensures we remove any empty strings and `|| []` guarantees we always return an array, matching the `IConfig` type.

---



---

