## SpecStory

## Code Cleanliness Improvement (1/19/2025, 8:06:44 PM)

_**User**_

can i make this cleaner

---

_**Assistant**_

I can help make this code cleaner by using early returns and removing the else statements. Here's the improved version:

```typescript:config/index.ts
import { isDev, isPreview } from "../utils/getEnv";
import { devConfig } from "./dev";
import { previewConfig } from "./preview";
import { prodConfig } from "./prod";

const ENV = {
  dev: devConfig,
  preview: previewConfig,
  prod: prodConfig,
} as const;

export function getConfig() {
  if (isDev) return ENV.dev;
  if (isPreview) return ENV.preview;
  return ENV.prod;
}

export const config = getConfig();
```

Changes made:
1. Removed unnecessary else statements and used early returns
2. Changed arrow function to a regular function following the style guide
3. Made the code more concise while maintaining readability

The logic remains exactly the same, but the code is now cleaner and follows the style guide better.

---

_**User**_

do you think ahving the getConfig is useful?

---

_**Assistant**_

Since `getConfig()` is only used once to create the exported `config` constant and isn't used anywhere else, we can simplify this further by removing the function and directly computing the config value:

```typescript:config/index.ts
import { isDev, isPreview } from "../utils/getEnv";
import { devConfig } from "./dev";
import { previewConfig } from "./preview";
import { prodConfig } from "./prod";

const ENV = {
  dev: devConfig,
  preview: previewConfig,
  prod: prodConfig,
} as const;

export const config = isDev ? ENV.dev : isPreview ? ENV.preview : ENV.prod;
```

This change:
1. Removes the unnecessary `getConfig` function since it's only used once
2. Uses a simple ternary expression to determine the config value
3. Makes the code more concise while still being readable

While normally we prefer early returns over ternaries (according to the style guide), in this case the ternary is quite clear and makes the code more compact without sacrificing readability, since we're just doing a simple configuration selection.

---

_**User**_

For the code present, we get this error:
```
Type '{ readonly env: "prod"; readonly xmtpEnv: "production"; readonly apiURI: "https://backend-prod.converse.xyz"; readonly debugMenu: false; readonly bundleId: "com.converse.prod" | "com.converse.native"; ... 13 more ...; readonly thirdwebClientId: string; }' is not assignable to type 'IConfig'.
  The types of 'walletConnectConfig.optionalChains' are incompatible between these types.
    Type 'Readonly<ChainOptions & { rpc: string; }>[]' is not assignable to type 'number[]'.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error suggests there's a type mismatch with `walletConnectConfig.optionalChains`. Looking at the shared config and error, we need to convert the chain options to numbers.

```typescript:config/prod.ts
// ... existing code ...
export const prodConfig: IConfig = {
  ...shared,
  walletConnectConfig: {
    ...shared.walletConnectConfig,
    optionalChains: shared.walletConnectConfig.optionalChains.map(chain => Number(chain.chainId))
  },
  env: Environments.prod,
  // ... existing code ...
} as const;
```

This maps the chain objects to just their chainId numbers, matching the `number[]` type expected in `IConfig`.

---

_**User**_

For the code present, we get this error:
```
Type '{ debugMenu: false; debugAddresses: string[]; lensApiDomain: string; lensSuffix: string; sentryDSN: string; framesAllowedSchemes: ("http" | "https" | "ethereum")[]; walletConnectConfig: { projectId: string; appMetadata: { ...; }; }; thirdwebClientId: string; }' does not satisfy the expected type 'IConfig'.
  Type '{ debugMenu: false; debugAddresses: string[]; lensApiDomain: string; lensSuffix: string; sentryDSN: string; framesAllowedSchemes: ("http" | "https" | "ethereum")[]; walletConnectConfig: { projectId: string; appMetadata: { ...; }; }; thirdwebClientId: string; }' is missing the following properties from type 'IConfig': env, xmtpEnv, apiURI, bundleId, and 7 more.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_



The error indicates that `shared` is missing required properties from `IConfig`. Since `shared` is meant to be partial config, we should use `Partial<IConfig>`:

```typescript:config/shared.ts
import { IConfig } from "@/config/config.types";

// Base configuration shared across all environments
export const shared = {
  debugMenu: false,
  // ... existing code ...
  thirdwebClientId: process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID,
} satisfies Partial<IConfig>;
```

This tells TypeScript that `shared` only contains a subset of `IConfig` properties.

---



---

