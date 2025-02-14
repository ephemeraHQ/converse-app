## SpecStory

## Update Code: Replace Account with Address (1/28/2025, 11:12:12 AM)

_**User**_

replace stuff that are cliek cleanAccount with cleanAddress. we should use ethAddress and not account...

---

_**Assistant**_

I'll help you update the variable names to use "address" instead of "account" for better consistency. Here are the necessary changes:

```typescript:utils/xmtpRN/client/client.ts
// ... existing code ...

// Update variable name
const xmtpClientByAddress: Record<
  string,
  ConverseXmtpClientType | Promise<ConverseXmtpClientType>
> = {};

// ... existing code ...

export async function deleteXmtpClient({ address }: { address: string }) {
  const cleanAddress = getCleanEthAddress(address);
  if (cleanAddress in xmtpClientByAddress) {
    stopStreamingAllMessage(cleanAddress);
    stopStreamingConversations(cleanAddress);
    stopStreamingConsent(cleanAddress);
  }
  delete xmtpClientByAddress[cleanAddress];
}

export async function getXmtpClient({
  address,
  inboxId,
}: {
  address: string;
  inboxId: InboxId;
}): Promise<ConverseXmtpClientType> {
  const cleanAddress = getCleanEthAddress(address);

  // Return existing client or promise if available
  if (cleanAddress in xmtpClientByAddress) {
    return xmtpClientByAddress[cleanAddress];
  }

  try {
    logger.debug("[XmtpRN] Getting client from address");
    const buildClientPromise = buildXmtpClient({
      address: cleanAddress,
      inboxId,
    });

    // Store the promise in the cache
    xmtpClientByAddress[cleanAddress] = buildClientPromise;

    const client = await buildClientPromise;
    logger.info(`[XmtpRN] Instantiated client for ${client.address}`);

    // Update cache with resolved client
    xmtpClientByAddress[cleanAddress] = client;
    return client;
  } catch (error) {
    delete xmtpClientByAddress[cleanAddress];
    throw error;
  }
}

// ... existing code ...
```

Changes made:
1. Renamed `xmtpClientByAccount` to `xmtpClientByAddress`
2. Updated function parameters from `account` to `address`
3. Renamed `cleanAccount` variables to `cleanAddress`
4. Updated all references to the cache object to use the new name

The changes make the code more consistent with Ethereum address terminology and align better with the function `getCleanEthAddress`.

---

_**User**_

even cleanAddress isn't good. it should be cleanedEthAddress. And you have too many of those. we just need to have a clean one when we try to access the xmtpClientByEthAddress object

---

_**Assistant**_

You're right. We should minimize the cleaning operations and only use it when accessing the cache. Here's the improved version:

```typescript:utils/xmtpRN/client/client.ts
// ... existing code ...

const xmtpClientByEthAddress: Record<
  string,
  ConverseXmtpClientType | Promise<ConverseXmtpClientType>
> = {};

export async function deleteXmtpClient({ address }: { address: string }) {
  const cleanedEthAddress = getCleanEthAddress(address);
  if (cleanedEthAddress in xmtpClientByEthAddress) {
    stopStreamingAllMessage(address);
    stopStreamingConversations(address);
    stopStreamingConsent(address);
  }
  delete xmtpClientByEthAddress[cleanedEthAddress];
}

export async function getXmtpClient({
  address,
  inboxId,
}: {
  address: string;
  inboxId: InboxId;
}): Promise<ConverseXmtpClientType> {
  const cleanedEthAddress = getCleanEthAddress(address);

  if (cleanedEthAddress in xmtpClientByEthAddress) {
    return xmtpClientByEthAddress[cleanedEthAddress];
  }

  try {
    logger.debug("[XmtpRN] Getting client from address");
    const buildClientPromise = buildXmtpClient({
      address,
      inboxId,
    });

    xmtpClientByEthAddress[cleanedEthAddress] = buildClientPromise;

    const client = await buildClientPromise;
    logger.info(`[XmtpRN] Instantiated client for ${client.address}`);

    xmtpClientByEthAddress[cleanedEthAddress] = client;
    return client;
  } catch (error) {
    delete xmtpClientByEthAddress[cleanedEthAddress];
    throw error;
  }
}

// ... existing code ...
```

Changes made:
1. Renamed cache object to `xmtpClientByEthAddress`
2. Only clean the address when accessing the cache object
3. Use original `address` for other operations (streaming, building client)
4. Renamed cleaned variable to `cleanedEthAddress` for clarity

---



---

