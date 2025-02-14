## SpecStory

## Reordering TypeScript Config Properties (1/20/2025, 5:34:47 PM)

_**User**_

reorder like @config.types.ts 

---

_**Assistant**_

I'll help reorder the properties in `preview.ts` to match the order defined in `config.types.ts`. Here's the reordered code:

```typescript:config/preview.ts
import { IConfig } from "@/config/config.types";
import { baseSepolia } from "wagmi/chains";
import { Environments } from "../utils/getEnv";
import { shared } from "./shared";

export const previewConfig: IConfig = {
  ...shared,
  debugMenu: true,
  // debugAddresses, lensApiDomain, lensSuffix, sentryDSN, framesAllowedSchemes, walletConnectConfig, thirdwebClientId come from shared
  env: Environments.preview,
  xmtpEnv: "dev" as const,
  apiURI: "https://backend-staging.converse.xyz",
  bundleId: "com.converse.preview",
  appleAppGroup: "group.com.converse.preview",
  scheme: "converse-preview",
  websiteDomain: "preview.converse.xyz",
  usernameSuffix: ".conversedev.eth",
  universalLinks: ["preview.converse.xyz/", "preview.getconverse.app/"].flatMap(
    (domain) => [`https://${domain}`, `http://${domain}`, domain]
  ),
  privy: {
    appId: process.env.EXPO_PUBLIC_PRIVY_APP_ID,
    defaultChain: baseSepolia,
  },
  evm: {
    rpcEndpoint: process.env.EXPO_PUBLIC_EVM_RPC_ENDPOINT,
    transactionChainId: "0x14a34", // Base Sepolia
    USDC: {
      contractAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      name: "USDC",
      version: "2",
      decimals: 6,
    },
  },
} as const;
```

I've reordered the properties to match the order in `IConfig` type definition:
1. debugMenu (explicit)
2. Properties from shared (debugAddresses through thirdwebClientId)
3. env
4. xmtpEnv
5. apiURI
6. bundleId
7. appleAppGroup
8. scheme
9. websiteDomain
10. usernameSuffix
11. universalLinks
12. privy
13. evm

I also added a comment to indicate which properties are coming from the shared config to maintain clarity.

---



---

