## SpecStory

## Importance of Lowercase in Ethereum Addresses (1/28/2025, 11:08:31 AM)

_**User**_

why do we do lowercase?

---

_**Assistant**_

In this code, converting the account address to lowercase (using `account.toLowerCase()`) is a common practice in blockchain and cryptocurrency applications for several reasons:

1. **Consistency**: Ethereum addresses can be written with mixed cases (checksum addresses), but they refer to the same address. For example, these are the same address:
   ```
   0xABC123...
   0xabc123...
   ```

2. **Preventing Duplicates**: By converting all addresses to lowercase before using them as keys in the `xmtpClientByAccount` object, we ensure that we don't accidentally create multiple client instances for the same address written in different cases.

3. **Comparison Reliability**: When comparing addresses (like checking if an address exists in `xmtpClientByAccount`), using lowercase ensures that case differences don't cause false negatives.

Here's a practical example of what could go wrong without lowercase normalization:

```typescript
// Without lowercase normalization
const clients = {
  "0xABC123": clientInstance1,
  "0xabc123": clientInstance2  // Oops! Same address, different case = two instances
};

// With lowercase normalization
const clients = {
  "0xabc123": clientInstance  // Only one instance, regardless of input case
};
```

This is particularly important in this code because the `xmtpClientByAccount` object is used to cache XMTP client instances, and we want to ensure we're always working with a single instance per unique address, regardless of how the address case was provided to the functions.

---

_**User**_

ok keep lowercase but can we have an util function like getCleanEthAddress for example?

---

_**Assistant**_

Yes, that's a good practice to centralize this logic! Here's how we can modify the code:

```typescript:utils/xmtpRN/client/client.ts
// ... existing code ...

// Add this at the top with other imports
import { getCleanEthAddress } from "@/utils/eth-address";

export async function deleteXmtpClient({ account }: { account: string }) {
  const cleanAccount = getCleanEthAddress(account);
  if (cleanAccount in xmtpClientByAccount) {
    stopStreamingAllMessage(account);
    stopStreamingConversations(account);
    stopStreamingConsent(account);
  }
  delete xmtpClientByAccount[cleanAccount];
}

export async function getXmtpClient({
  account,
  inboxId,
}: {
  account: string;
  inboxId: InboxId;
}): Promise<ConverseXmtpClientType> {
  const cleanAccount = getCleanEthAddress(account);

  // Return existing client if available
  const existingClient = xmtpClientByAccount[cleanAccount];
  if (existingClient) {
    return existingClient;
  }

  // ... existing code ...

  // Initialize new client
  const clientPromise = initializeNewClient({
    account: cleanAccount,
    inboxId,
  });
  xmtpClientByAccount[cleanAccount] = clientPromise;

  return clientPromise;
}

// ... existing code ...
```

And here's the new utility function we should create:

```typescript:utils/eth-address.ts
export function getCleanEthAddress(address: string): string {
  return address.toLowerCase();
}
```

This change:
1. Centralizes the address cleaning logic in a dedicated utility function
2. Makes the intent clearer with a descriptive function name
3. Makes it easier to modify address cleaning logic in the future if needed (e.g., if we need to add additional validation or formatting)
4. Follows the principle of DRY (Don't Repeat Yourself)

---



---

