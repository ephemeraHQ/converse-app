## SpecStory

## Function File Organization Discussion (1/28/2025, 11:14:55 AM)

_**User**_

in which file should this function be? happy to create new file if needed

---

_**Assistant**_

Based on the code style guide and the function's purpose, I recommend moving `getEthereumRecoveryAddressForInboxId` to a new file since it's dealing with a specific XMTP inbox-related functionality. Let's create a new file called `utils/xmtpRN/xmtp-inbox/xmtp-inbox.ts`.

Here's how the new file should look:

```typescript:utils/xmtpRN/xmtp-inbox/xmtp-inbox.ts
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";
import { getXmtpClientForCurrentInboxOrThrow } from "@/utils/xmtpRN/xmtp-client/xmtp-client";

// Cache to store inbox ID to address mappings
const inboxIdToAddressesCache = new Map<string, string>();

export async function getEthereumRecoveryAddressForInboxId({
  inboxId,
}: {
  inboxId: InboxId;
}): Promise<string> {
  if (inboxIdToAddressesCache.has(inboxId.toLowerCase())) {
    return inboxIdToAddressesCache.get(inboxId.toLowerCase()) as string;
  }

  const client = getXmtpClientForCurrentInboxOrThrow({
    caller: "getAddressesForInboxId",
  });
  const refreshFromNetwork = true;
  const inboxStates = await client.inboxStates(refreshFromNetwork, [inboxId]);
  const targettedInboxState = inboxStates.find(
    (inboxState) => inboxState.inboxId === inboxId
  );
  if (!targettedInboxState) {
    throw new Error("Inbox state not found");
  }

  const ethereumRecoveryAddressForInbox =
    targettedInboxState.recoveryAddress.toLowerCase();

  if (!ethereumRecoveryAddressForInbox) {
    throw new Error(
      "[inboxIdToAddressesCache] Ethereum recovery address not found"
    );
  }

  inboxIdToAddressesCache.set(
    inboxId.toLowerCase(),
    ethereumRecoveryAddressForInbox
  );

  return ethereumRecoveryAddressForInbox;
}
```

Reasons for this decision:
1. The function deals specifically with XMTP inbox functionality, so it deserves its own module
2. Following the file structure guidelines, we're creating it within the `xmtpRN` directory in a feature-specific subfolder
3. The function is focused on a single responsibility (getting the recovery address for an inbox ID)
4. We're maintaining the cache at the module level
5. The file name matches the functionality it provides
6. We're using object parameters as per the style guide

You'll need to update any imports in files that were using this function to point to the new location.

---



---

