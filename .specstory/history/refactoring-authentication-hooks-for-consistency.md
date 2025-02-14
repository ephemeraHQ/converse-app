## SpecStory

## Refactoring Authentication Hooks for Consistency (2/13/2025, 12:42:40 PM)

_**User**_

refactor this to make something like 

---

_**Assistant**_

I'll help refactor the code to fix the linter error and improve the implementation. The error occurs because `AuthStatuses.signingIn` doesn't exist. Let's update both files to handle the authentication states consistently.

First, let's update the login hook:

```typescript:features/onboarding/hooks/use-login-with-passkey.ts
import {
  AuthStatuses,
  useAuthStore,
} from "@/features/authentication/auth.store";
import { useExecuteOnceWhenReady } from "@/hooks/use-execute-once-when-ready";
import { captureErrorWithToast } from "@/utils/capture-error";
import logger from "@/utils/logger";
import { useLoginWithPasskey as usePrivyLoginWithPasskey } from "@privy-io/expo/passkey";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import {
  RELYING_PARTY,
  createInboxWithSigner,
  createSmartWalletSigner,
} from "../utils/passkey-utils";

export function useLoginWithPasskey() {
  const { client: smartWalletClient } = useSmartWallets();
  const { loginWithPasskey: privyLoginWithPasskey } = usePrivyLoginWithPasskey({
    onSuccess: () => {
      useAuthStore.getState().actions.setStatus("signedIn");
    },
    onError: (error) => {
      logger.error(`[login-with-passkey] Error logging in: ${error}`);
      captureErrorWithToast(error);
      useAuthStore.getState().actions.setStatus("signedOut");
    },
  });

  const isAuthenticating = useAuthStore(
    (state) => state.status === "undetermined"
  );

  useExecuteOnceWhenReady({
    callback: async (smartWalletClient) => {
      try {
        const signer = createSmartWalletSigner(smartWalletClient);
        await createInboxWithSigner(signer);
      } catch (error) {
        logger.error(
          `[login-with-passkey] Error handling smart wallet ready: ${error}`
        );
        captureErrorWithToast(error);
      }
    },
    deps: [smartWalletClient, isAuthenticating],
  });

  const login = async () => {
    try {
      useAuthStore.getState().actions.setStatus("undetermined");
      await privyLoginWithPasskey({
        relyingParty: RELYING_PARTY,
      });
    } catch (error) {
      logger.error(`[login-with-passkey] Error initiating login: ${error}`);
      captureErrorWithToast(error);
      useAuthStore.getState().actions.setStatus("signedOut");
    }
  };

  return { login };
}
```

And let's update the signup hook to match this pattern:

```typescript:features/onboarding/hooks/use-signup-with-passkey.ts
// ... existing imports ...

export function useSignupWithPasskey() {
  const { create: createEmbeddedWallet } = useEmbeddedEthereumWallet();
  const { getClientForChain } = useSmartWallets();

  const { signupWithPasskey: privySignupWithPasskey } =
    usePrivySignupWithPasskey({
      onSuccess: async () => {
        try {
          // Create embedded wallet first
          const { user: privyUser } = await createEmbeddedWallet();

          const smartWalletAccount = privyUser.linked_accounts.find(
            (account): account is PrivySmartWalletAccount =>
              account.type === "smart_wallet"
          );

          if (!smartWalletAccount) {
            throw new Error("Smart wallet account not found");
          }

          // Get smart wallet client for the chain
          const smartWalletClient = await getClientForChain({
            chainId: base.id,
          });

          if (!smartWalletClient) {
            throw new Error("Smart wallet client not ready");
          }

          // Create signer
          const signer = createSmartWalletSigner(smartWalletClient);

          // Create inbox
          const { inboxId } = await createInboxWithSigner(signer);

          const smartContractWalletAddress = await signer.getAddress();

          // Create user in database
          await createUser({
            privyUserId: privyUser.id,
            smartContractWalletAddress,
            inboxId,
          });

          useAuthStore.getState().actions.setStatus("signedIn");
        } catch (error) {
          logger.error(
            `[signup-with-passkey] Error in onSuccess handler: ${error}`
          );
          captureErrorWithToast(error);
          useAuthStore.getState().actions.setStatus("signedOut");
        }
      },
      onError: (error) => {
        logger.error(`[signup-with-passkey] Error signing up: ${error}`);
        captureErrorWithToast(error);
        useAuthStore.getState().actions.setStatus("signedOut");
      },
    });

  const signup = async () => {
    try {
      useAuthStore.getState().actions.setStatus("undetermined");
      await privySignupWithPasskey({
        relyingParty: RELYING_PARTY,
      });
    } catch (error) {
      logger.error(`[signup-with-passkey] Error initiating signup: ${error}`);
      captureErrorWithToast(error);
      useAuthStore.getState().actions.setStatus("signedOut");
    }
  };

  return { signup };
}
```

Key changes made:

1. Removed the non-existent `signingIn` status and used `undetermined` instead, which appears to be one of the valid statuses from the error message
2. Added proper error handling with status updates in both hooks
3. Added onSuccess/onError handlers to the login hook to manage auth status
4. Made the status management consistent between login and signup flows
5. Added try/catch blocks around the main login/signup operations
6. Improved error logging with more specific messages

The code now handles authentication states consistently and provides better error handling and status management throughout the authentication process.

---

_**User**_

i don,t want to use the client in the useSmartWallets , i want to getSmartWalletClient instead. The less rerender the better!

---

_**Assistant**_

Ah, I understand! Let's modify both hooks to use `getSmartWalletClient` instead of the `client` to minimize rerenders. Here are the changes:

```typescript:features/onboarding/hooks/use-login-with-passkey.ts
import {
  AuthStatuses,
  useAuthStore,
} from "@/features/authentication/auth.store";
import { useExecuteOnceWhenReady } from "@/hooks/use-execute-once-when-ready";
import { captureErrorWithToast } from "@/utils/capture-error";
import logger from "@/utils/logger";
import { useLoginWithPasskey as usePrivyLoginWithPasskey } from "@privy-io/expo/passkey";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import {
  RELYING_PARTY,
  createInboxWithSigner,
  createSmartWalletSigner,
} from "../utils/passkey-utils";
import { base } from "thirdweb/chains";

export function useLoginWithPasskey() {
  const { getSmartWalletClient } = useSmartWallets();
  const { loginWithPasskey: privyLoginWithPasskey } = usePrivyLoginWithPasskey({
    onSuccess: async () => {
      try {
        const smartWalletClient = await getSmartWalletClient({
          chainId: base.id,
        });

        if (!smartWalletClient) {
          throw new Error("Smart wallet client not ready");
        }

        const signer = createSmartWalletSigner(smartWalletClient);
        await createInboxWithSigner(signer);
        useAuthStore.getState().actions.setStatus("signedIn");
      } catch (error) {
        logger.error(`[login-with-passkey] Error in onSuccess handler: ${error}`);
        captureErrorWithToast(error);
        useAuthStore.getState().actions.setStatus("signedOut");
      }
    },
    onError: (error) => {
      logger.error(`[login-with-passkey] Error logging in: ${error}`);
      captureErrorWithToast(error);
      useAuthStore.getState().actions.setStatus("signedOut");
    },
  });

  const login = async () => {
    try {
      useAuthStore.getState().actions.setStatus("undetermined");
      await privyLoginWithPasskey({
        relyingParty: RELYING_PARTY,
      });
    } catch (error) {
      logger.error(`[login-with-passkey] Error initiating login: ${error}`);
      captureErrorWithToast(error);
      useAuthStore.getState().actions.setStatus("signedOut");
    }
  };

  return { login };
}
```

```typescript:features/onboarding/hooks/use-signup-with-passkey.ts
import { useAuthStore } from "@/features/authentication/auth.store";
import { createUser } from "@/utils/api/users";
import { captureErrorWithToast } from "@/utils/capture-error";
import logger from "@/utils/logger";
import { useEmbeddedEthereumWallet } from "@privy-io/expo";
import { useSignupWithPasskey as usePrivySignupWithPasskey } from "@privy-io/expo/passkey";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import type { PrivySmartWalletAccount } from "@privy-io/public-api";
import { base } from "thirdweb/chains";
import {
  RELYING_PARTY,
  createInboxWithSigner,
  createSmartWalletSigner,
} from "../utils/passkey-utils";

export function useSignupWithPasskey() {
  const { create: createEmbeddedWallet } = useEmbeddedEthereumWallet();
  const { getSmartWalletClient } = useSmartWallets();

  const { signupWithPasskey: privySignupWithPasskey } =
    usePrivySignupWithPasskey({
      onSuccess: async () => {
        try {
          // Create embedded wallet first
          const { user: privyUser } = await createEmbeddedWallet();

          const smartWalletAccount = privyUser.linked_accounts.find(
            (account): account is PrivySmartWalletAccount =>
              account.type === "smart_wallet"
          );

          if (!smartWalletAccount) {
            throw new Error("Smart wallet account not found");
          }

          // Get smart wallet client for the chain
          const smartWalletClient = await getSmartWalletClient({
            chainId: base.id,
          });

          if (!smartWalletClient) {
            throw new Error("Smart wallet client not ready");
          }

          // Create signer
          const signer = createSmartWalletSigner(smartWalletClient);

          // Create inbox
          const { inboxId } = await createInboxWithSigner(signer);

          const smartContractWalletAddress = await signer.getAddress();

          // Create user in database
          await createUser({
            privyUserId: privyUser.id,
            smartContractWalletAddress,
            inboxId,
          });

          useAuthStore.getState().actions.setStatus("signedIn");
        } catch (error) {
          logger.error(
            `[signup-with-passkey] Error in onSuccess handler: ${error}`
          );
          captureErrorWithToast(error);
          useAuthStore.getState().actions.setStatus("signedOut");
        }
      },
      onError: (error) => {
        logger.error(`[signup-with-passkey] Error signing up: ${error}`);
        captureErrorWithToast(error);
        useAuthStore.getState().actions.setStatus("signedOut");
      },
    });

  const signup = async () => {
    try {
      useAuthStore.getState().actions.setStatus("undetermined");
      await privySignupWithPasskey({
        relyingParty: RELYING_PARTY,
      });
    } catch (error) {
      logger.error(`[signup-with-passkey] Error initiating signup: ${error}`);
      captureErrorWithToast(error);
      useAuthStore.getState().actions.setStatus("signedOut");
    }
  };

  return { signup };
}
```

Key changes made:

1. Removed `useExecuteOnceWhenReady` from login hook since we now handle the smart wallet client in the `onSuccess` callback
2. Changed from using `client` to `getSmartWalletClient` in both hooks
3. Changed from `getClientForChain` to `getSmartWalletClient` in the signup hook
4. Added proper error handling around the smart wallet client initialization
5. Moved the inbox creation to the `onSuccess` callback in the login hook
6. Made both hooks more consistent in their error handling and status management

These changes should reduce unnecessary rerenders since we're no longer subscribing to the smart wallet client state directly.

---



---

