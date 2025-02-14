## SpecStory

## Reordering TypeScript Config Type (1/20/2025, 5:33:22 PM)

_**User**_

reorder like @prod.ts  and @dev.ts 

---

_**Assistant**_

I'll help you reorder the IEvmConfig type to match the structure used in prod.ts and dev.ts. Here's the updated type definition:

```typescript:config/config.types.ts
// ... existing code ...

type IEvmConfig = {
  rpcEndpoint: string | undefined;
  transactionChainId: string;
  USDC: {
    contractAddress: string;
    name: string;
    version: string;
    decimals: number;
  };
};

// ... existing code ...
```

The main changes are:
1. Removed the unnecessary intersection type with `[key in IEvm]?`
2. Moved the common fields (transactionChainId and USDC) to the root level of the type to match how they're being used in prod.ts and preview.ts
3. Kept the structure consistent with how it's actually being used in the configuration files

This change will ensure the type definition matches the actual usage pattern in the configuration files while maintaining type safety.

---



---

