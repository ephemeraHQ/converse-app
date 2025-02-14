## SpecStory

## Refactoring the functions to improve modularity and reduce the number of parameters is a great approach. Here’s a revised version of the `initXmtpClient` and `connectWithBase64Key` functions, focusing on making them more independent and functional:

```typescript:components/Onboarding/init-xmtp-client.ts
import { Signer } from "ethers";
import { translate } from "i18n-js";
import { Alert } from "react-native";

import { initDb } from "../../data/db";
import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import {
  getSettingsStore,
  getWalletStore,
  useAccountsStore,
} from "../../data/store/accountsStore";
import {
  ConnectionMethod,
  useOnboardingStore,
} from "../../data/store/onboardingStore";
import { awaitableAlert } from "../../utils/alert";
import { saveXmtpKey } from "../../utils/keychain/helpers";
import logger from "../../utils/logger";
import { logoutAccount, waitForLogoutTasksDone } from "../../utils/logout";
import { sentryTrackMessage } from "../../utils/sentry";
import { getXmtpBase64KeyFromSigner } from "../../utils/xmtpRN/signIn";
import { getXmtpClient } from "../../utils/xmtpRN/sync";

type InitXmtpClientArgs = {
  signer: Signer;
  address: string;
  connectionMethod: ConnectionMethod;
  privyAccountId: string;
  isEphemeral: boolean;
  pkPath: string;
};

async function retrieveXmtpKey(signer: Signer): Promise<string> {
  return await getXmtpBase64KeyFromSigner(signer, async () => {
    await awaitableAlert(
      translate("current_installation_revoked"),
      translate("current_installation_revoked_description")
    );
    throw new Error("Current installation revoked");
  });
}

async function saveXmtpKeyAndSetup(args: {
  address: string;
  base64Key: string;
  connectionMethod: ConnectionMethod;
  privyAccountId: string;
  isEphemeral: boolean;
  pkPath: string;
}) {
  const { address, base64Key, connectionMethod, privyAccountId, isEphemeral, pkPath } = args;

  await saveXmtpKey(address, base64Key);
  useAccountsStore.getState().setCurrentAccount(address, true);

  if (connectionMethod === "phone" && privyAccountId) {
    useAccountsStore.getState().setPrivyAccountId(address, privyAccountId);
  }

  await initDb(address);
  await refreshProfileForAddress(address, address);
  
  useAccountsStore.getState().setCurrentAccount(address, false);
  getSettingsStore(address).getState().setOnboardedAfterProfilesRelease(true);
  getSettingsStore(address).getState().setEphemeralAccount(isEphemeral);
  
  if (pkPath) {
    getWalletStore(address).getState().setPrivateKeyPath(pkPath);
  }
  
  useOnboardingStore.getState().setAddingNewAccount(false);
}

export async function initXmtpClient(args: InitXmtpClientArgs) {
  const { signer, address } = args;

  if (!signer || !address) {
    throw new Error("No signer or address");
  }

  try {
    const base64Key = await retrieveXmtpKey(signer);
    await saveXmtpKeyAndSetup({ ...args, base64Key });
    getXmtpClient(address);
    sentryTrackMessage("Connecting done!");
  } catch (error) {
    await logoutAccount(await signer.getAddress(), false, true, () => {}, () => {});
    logger.error(error);
    throw error;
  }
}
```

### Key Changes Made:

1. **Separation of Concerns**: The logic for retrieving the XMTP key and saving it along with the setup has been separated into distinct functions (`retrieveXmtpKey` and `saveXmtpKeyAndSetup`). This makes each function easier to understand and maintain.

2. **Reduced Parameters**: The `saveXmtpKeyAndSetup` function takes a single object parameter that contains all necessary data, reducing the number of parameters passed around.

3. **Error Handling**: The error handling is centralized in the `initXmtpClient` function, which makes it easier to manage.

4. **Modularity**: Each function now has a single responsibility, making it easier to test and reuse.

This refactoring should help in making the codebase cleaner and more maintainable while adhering to functional programming principles. (10/2/2024, 4:37:19 PM)

_**User**_

you can see that those 2 functions are a mess... too many params. And initXmtpClient calls connectWithBase64Key... I want the 2 to be independant and have many of them so it's more functionnal pattern

---

_**Assistant**_

You're absolutely right. Let's refactor these functions to make them more independent and follow a more functional pattern. We'll break them down into smaller, more focused functions and use a more modular approach. Here's a refactored version:

```typescript:components/Onboarding/init-xmtp-client.ts
import { Signer } from "ethers";
import { translate } from "i18n-js";
import { Alert } from "react-native";

import { initDb } from "../../data/db";
import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import {
  getSettingsStore,
  getWalletStore,
  useAccountsStore,
} from "../../data/store/accountsStore";
import {
  ConnectionMethod,
  useOnboardingStore,
} from "../../data/store/onboardingStore";
import { awaitableAlert } from "../../utils/alert";
import { saveXmtpKey } from "../../utils/keychain/helpers";
import logger from "../../utils/logger";
import { logoutAccount, waitForLogoutTasksDone } from "../../utils/logout";
import { sentryTrackMessage } from "../../utils/sentry";
import { getXmtpBase64KeyFromSigner } from "../../utils/xmtpRN/signIn";
import { getXmtpClient } from "../../utils/xmtpRN/sync";

// Types
type IInitXmtpClientArgs = {
  signer: Signer;
  address: string;
  connectionMethod: ConnectionMethod;
  privyAccountId: string;
  isEphemeral: boolean;
  pkPath: string;
};

type IConnectWithBase64KeyArgs = {
  address: string;
  base64Key: string;
  connectionMethod: ConnectionMethod;
  privyAccountId: string;
  isEphemeral: boolean;
  pkPath: string;
};

// Helper functions
function validateAddress(address: string): void {
  if (!address) {
    sentryTrackMessage("Could not connect because no address");
    throw new Error("No address provided");
  }
}

async function handleXmtpKeyRetrieval(signer: Signer): Promise<string | undefined> {
  return await getXmtpBase64KeyFromSigner(signer, async () => {
    await awaitableAlert(
      translate("current_installation_revoked"),
      translate("current_installation_revoked_description")
    );
    throw new Error("Current installation revoked");
  });
}

async function setupStorage(args: IConnectWithBase64KeyArgs): Promise<void> {
  const { address, connectionMethod, privyAccountId, isEphemeral, pkPath } = args;
  
  useAccountsStore.getState().setCurrentAccount(address, true);
  
  if (connectionMethod === "phone" && privyAccountId) {
    useAccountsStore.getState().setPrivyAccountId(address, privyAccountId);
  }
  
  await initDb(address);
  await refreshProfileForAddress(address, address);
  
  useAccountsStore.getState().setCurrentAccount(address, false);
  getSettingsStore(address).getState().setOnboardedAfterProfilesRelease(true);
  getSettingsStore(address).getState().setEphemeralAccount(isEphemeral);
  
  if (pkPath) {
    getWalletStore(address).getState().setPrivateKeyPath(pkPath);
  }
  
  useOnboardingStore.getState().setAddingNewAccount(false);
}

// Main functions
export async function initXmtpClient(args: IInitXmtpClientArgs): Promise<void> {
  const { signer, address, ...rest } = args;
  
  if (!signer || !address) {
    throw new Error("No signer or address");
  }

  try {
    const base64Key = await handleXmtpKeyRetrieval(signer);
    if (!base64Key) return;

    await connectWithBase64Key({ address, base64Key, ...rest });
  } catch (e) {
    await logoutAccount(await signer.getAddress(), false, true, () => {}, () => {});
    logger.error(e);
    throw e;
  }
}

export async function connectWithBase64Key(args: IConnectWithBase64KeyArgs): Promise<void> {
  const { address, base64Key } = args;
  
  logger.debug("In connectWithBase64Key");
  validateAddress(address);
  
  try {
    logger.debug("Waiting for logout tasks");
    await waitForLogoutTasksDone(500);
    
    logger.debug("Logout tasks done, saving xmtp key");
    await saveXmtpKey(address, base64Key);
    logger.debug("XMTP Key saved");
    
    await setupStorage(args);
    
    // Now we can instantiate the XMTP Client
    getXmtpClient(address);
    sentryTrackMessage("Connecting done!");
  } catch (e) {
    logger.error(e, { context: "Onboarding - connectWithBase64Key" });
    Alert.alert(translate("onboarding_error"));
    throw e;
  }
}
```

This refactored version introduces several improvements:

1. We've created separate types for the arguments of each main function.
2. We've broken down the large functions into smaller, more focused helper functions.
3. The `initXmtpClient` and `connectWithBase64Key` functions are now more independent, with `initXmtpClient` focusing on getting the base64 key and `connectWithBase64Key` handling the connection process.
4. We've introduced a `validateAddress` function to centralize address validation.
5. The `setupStorage` function encapsulates all the storage-related operations.
6. Error handling is more consistent across the functions.

This refactored version is more modular, easier to read, and follows a more functional pattern. Each function now has a more specific responsibility, making the code easier to maintain and test.

---

_**User**_

I don't want initXmptClient to call connectWithBase64Key. I want each to do minium things and don't have many args possible!!

---

_**Assistant**_

I apologize for the misunderstanding. You're absolutely right - let's break these down into smaller, more focused functions with minimal arguments. Here's a revised version that separates the concerns more clearly:

```typescript:components/Onboarding/init-xmtp-client.ts
import { Signer } from "ethers";
import { translate } from "i18n-js";
import { Alert } from "react-native";

import { initDb } from "../../data/db";
import { refreshProfileForAddress } from "../../data/helpers/profiles/profilesUpdate";
import {
  getSettingsStore,
  getWalletStore,
  useAccountsStore,
} from "../../data/store/accountsStore";
import { useOnboardingStore } from "../../data/store/onboardingStore";
import { awaitableAlert } from "../../utils/alert";
import { saveXmtpKey } from "../../utils/keychain/helpers";
import logger from "../../utils/logger";
import { waitForLogoutTasksDone } from "../../utils/logout";
import { sentryTrackMessage } from "../../utils/sentry";
import { getXmtpBase64KeyFromSigner } from "../../utils/xmtpRN/signIn";
import { getXmtpClient } from "../../utils/xmtpRN/sync";

// Types
type IAddress = { address: string };

// Helper functions
function validateAddress(address: string): void {
  if (!address) {
    sentryTrackMessage("Could not connect because no address");
    throw new Error("No address provided");
  }
}

async function handleXmtpKeyRetrieval(signer: Signer): Promise<string | undefined> {
  return await getXmtpBase64KeyFromSigner(signer, async () => {
    await awaitableAlert(
      translate("current_installation_revoked"),
      translate("current_installation_revoked_description")
    );
    throw new Error("Current installation revoked");
  });
}

async function saveKey(args: IAddress & { base64Key: string }): Promise<void> {
  const { address, base64Key } = args;
  await waitForLogoutTasksDone(500);
  await saveXmtpKey(address, base64Key);
}

async function setupDatabase(args: IAddress): Promise<void> {
  const { address } = args;
  await initDb(address);
  await refreshProfileForAddress(address, address);
}

function updateAccountSettings(args: IAddress & { isEphemeral: boolean, pkPath?: string }): void {
  const { address, isEphemeral, pkPath } = args;
  useAccountsStore.getState().setCurrentAccount(address, false);
  getSettingsStore(address).getState().setOnboardedAfterProfilesRelease(true);
  getSettingsStore(address).getState().setEphemeralAccount(isEphemeral);
  if (pkPath) {
    getWalletStore(address).getState().setPrivateKeyPath(pkPath);
  }
  useOnboardingStore.getState().setAddingNewAccount(false);
}

// Main functions
export async function initXmtpClient(args: { signer: Signer }): Promise<string | undefined> {
  const { signer } = args;

  if (!signer) {
    throw new Error("No signer provided");
  }

  try {
    return await handleXmtpKeyRetrieval(signer);
  } catch (e) {
    logger.error(e);
    throw e;
  }
}

export async function connectWithBase64Key(args: IAddress & { base64Key: string }): Promise<void> {
  const { address, base64Key } = args;
  
  logger.debug("In connectWithBase64Key");
  validateAddress(address);
  
  try {
    await saveKey({ address, base64Key });
    logger.debug("XMTP Key saved");
    
    await setupDatabase({ address });
    
    // Now we can instantiate the XMTP Client
    getXmtpClient(address);
    sentryTrackMessage("Connecting done!");
  } catch (e) {
    logger.error(e, { context: "Onboarding - connectWithBase64Key" });
    Alert.alert(translate("onboarding_error"));
    throw e;
  }
}

export function finalizeAccountSetup(args: IAddress & { isEphemeral: boolean, pkPath?: string }): void {
  updateAccountSettings(args);
}
```

In this revised version:

1. `initXmtpClient` now only handles getting the base64 key from the signer. It doesn't call `connectWithBase64Key`.

2. `connectWithBase64Key` focuses on saving the key, setting up the database, and initializing the XMTP client.

3. We've introduced a new function `finalizeAccountSetup` to handle the account settings updates.

4. Each function now has fewer arguments and a more focused responsibility.

5. We've kept some helper functions to maintain readability and modularity.

This approach allows you to use these functions independently and in a more flexible way. For example:

```typescript
const base64Key = await initXmtpClient({ signer });
if (base64Key) {
  await connectWithBase64Key({ address, base64Key });
  finalizeAccountSetup({ address, isEphemeral, pkPath });
}
```

This structure gives you more control over the flow and allows for easier testing and maintenance of each part of the process.

---



---

