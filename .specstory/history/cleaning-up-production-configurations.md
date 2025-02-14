## SpecStory

## Cleaning Up Production Configurations (1/20/2025, 5:35:39 PM)

_**User**_

if the valeu is in @shared.ts  remove it

---

_**Assistant**_

I'll help you clean up the `prod.config.ts` file by removing values that are already defined in `shared.ts`. Here's the simplified version with only the unique values:

```typescript:config/prod.ts
import { IConfig } from "@/config/config.types";
import { Platform } from "react-native";
import { Environments } from "../utils/getEnv";
import { shared } from "./shared";

export const prodConfig: IConfig = {
  ...shared,
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

I removed the following redundant properties since they're already defined in `shared.ts`:
- debugMenu
- debugAddresses
- lensApiDomain
- lensSuffix
- sentryDSN
- framesAllowedSchemes
- thirdwebClientId

The rest of the configuration remains unchanged as these values are specific to the production environment.

---



---

