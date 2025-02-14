## SpecStory

## Refactoring Signup and Login Hooks (2/12/2025, 11:10:51 AM)

_**User**_

ok i need to redo all this. I feel using a context here isn't good... and we mix sign up and login stuff...  maybe instead we have a useSignup and useLogin hooks? and also maybe remove some unncessary useEffect that just logs stuff you know. Trying to make it easy to understand what's going on and separate things here

---

_**Assistant**_

I'll help you refactor this into separate hooks for better separation of concerns and cleaner code. Let's create two new hooks and remove unnecessary logging.

First, let's create two new files:

```typescript:features/onboarding/hooks/use-signup-with-passkey.ts
import { useSignupWithPasskey as usePrivySignupWithPasskey } from "@privy-io/expo/passkey";
import { usePrivy, useEmbeddedEthereumWallet } from "@privy-io/expo";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import { RELYING_PARTY } from "@/features/onboarding/passkey.constants";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { InboxSigner } from "@/features/multi-inbox/multi-inbox-client.types";
import { createUser } from "@/utils/api/users";
import { captureErrorWithToast } from "@/utils/capture-error";
import logger from "@/utils/logger";

export function useSignupWithPasskey() {
  const { create: createEmbeddedWallet } = useEmbeddedEthereumWallet();
  const { client: smartWalletClient } = useSmartWallets();
  const { user: privyUser } = usePrivy();

  const { signupWithPasskey: privySignupWithPasskey } = usePrivySignupWithPasskey({
    onSuccess: () => {
      createEmbeddedWallet();
    },
    onError: (error) => {
      logger.error(`[signup-with-passkey] Error signing up: ${error}`);
      captureErrorWithToast(error);
    },
  });

  async function handleSmartWalletReady() {
    if (!smartWalletClient || !privyUser) return;

    const signer: InboxSigner = {
      getAddress: async () => smartWalletClient.account.address,
      getChainId: () => smartWalletClient.chain?.id,
      getBlockNumber: () => undefined,
      walletType: () => "SCW",
      signMessage: async (message: string) => smartWalletClient.signMessage({ message }),
    };

    const { inboxId } = await MultiInboxClient.instance.createNewInboxForPrivySmartContractWallet({
      inboxSigner: signer,
    });

    const smartContractWalletAddress = await signer.getAddress();
    await createUser({
      privyUserId: privyUser.id,
      smartContractWalletAddress,
      inboxId,
    });
  }

  const signup = async () => {
    await privySignupWithPasskey({
      relyingParty: RELYING_PARTY,
    });
  };

  return {
    signup,
    handleSmartWalletReady,
  };
}
```

```typescript:features/onboarding/hooks/use-login-with-passkey.ts
import { useLoginWithPasskey as usePrivyLoginWithPasskey } from "@privy-io/expo/passkey";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import { RELYING_PARTY } from "@/features/onboarding/passkey.constants";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { InboxSigner } from "@/features/multi-inbox/multi-inbox-client.types";
import logger from "@/utils/logger";

export function useLoginWithPasskey() {
  const { client: smartWalletClient } = useSmartWallets();
  const { loginWithPasskey: privyLoginWithPasskey } = usePrivyLoginWithPasskey();

  async function handleSmartWalletReady() {
    if (!smartWalletClient) return;

    const signer: InboxSigner = {
      getAddress: async () => smartWalletClient.account.address,
      getChainId: () => smartWalletClient.chain?.id,
      getBlockNumber: () => undefined,
      walletType: () => "SCW",
      signMessage: async (message: string) => smartWalletClient.signMessage({ message }),
    };

    await MultiInboxClient.instance.createNewInboxForPrivySmartContractWallet({
      inboxSigner: signer,
    });
  }

  const login = async () => {
    await privyLoginWithPasskey({
      relyingParty: RELYING_PARTY,
    });
  };

  return {
    login,
    handleSmartWalletReady,
  };
}
```

Now let's update the original context file to use these hooks:

```typescript:features/onboarding/contexts/signup-with-passkey.context.tsx
import { createContext, useContext } from "react";
import { useSignupWithPasskey } from "../hooks/use-signup-with-passkey";
import { useLoginWithPasskey } from "../hooks/use-login-with-passkey";

const AuthenticateWithPasskeyContext = createContext<{
  signupWithPasskey: () => Promise<void>;
  loginWithPasskey: () => Promise<void>;
} | undefined>(undefined);

export function AuthenticateWithPasskeyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { signup } = useSignupWithPasskey();
  const { login } = useLoginWithPasskey();

  return (
    <AuthenticateWithPasskeyContext.Provider
      value={{
        signupWithPasskey: signup,
        loginWithPasskey: login,
      }}
    >
      {children}
    </AuthenticateWithPasskeyContext.Provider>
  );
}

export function useAuthenticateWithPasskey() {
  const context = useContext(AuthenticateWithPasskeyContext);
  if (!context) {
    throw new Error(
      "useAuthenticateWithPasskey must be used within a AuthenticateWithPasskeyProvider"
    );
  }
  return context;
}
```

Key improvements made:

1. Separated signup and login logic into their own hooks for better separation of concerns
2. Removed unnecessary useEffects that were just for logging
3. Simplified the smart wallet client handling logic
4. Made the code more focused and easier to understand
5. Removed state management from the context level
6. Each hook now has a clear, single responsibility
7. Removed duplicate code between signup and login flows
8. Made error handling more consistent
9. Removed unnecessary state tracking and effects

You can now use these hooks directly in your components if you don't need the context, or continue using the context if you need the authentication methods available throughout your app.

Let me know if you'd like me to explain any part of this refactor or make additional improvements!

---

_**User**_

i don't want a context anymore

---

_**Assistant**_

I'll help you remove the context and simplify the architecture. Since we don't need the context anymore, we can delete the context file entirely and just use the hooks directly in the components that need them.

Let's delete the context file:

```diff:features/onboarding/contexts/signup-with-passkey.context.tsx
- // Delete this entire file
```

Now components can directly import and use the hooks:

```typescript
// In any component that needs authentication:
import { useSignupWithPasskey } from "@/features/onboarding/hooks/use-signup-with-passkey";
import { useLoginWithPasskey } from "@/features/onboarding/hooks/use-login-with-passkey";

export function SomeComponent() {
  const { signup, handleSmartWalletReady } = useSignupWithPasskey();
  const { login, handleSmartWalletReady: handleLoginSmartWalletReady } = useLoginWithPasskey();
  
  // Use the hooks directly...
}
```

You'll need to:
1. Remove the AuthenticateWithPasskeyProvider from wherever it's being used in your app
2. Update any components that were using useAuthenticateWithPasskey to import and use the hooks directly

Would you like me to help you update any specific components that were using the context?

---

_**User**_

should both hooks share stuff between each otehrs? like maybe we have a utils file with stuff we can import? Also do you think the hooks can call "handleSmartWalletReady" themselves 

---

_**Assistant**_

Yes to both suggestions! Let's create a shared utils file and make the hooks more self-contained by handling the smart wallet ready state internally.

First, let's create a shared utils file:

```typescript:features/onboarding/utils/passkey-utils.ts
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import { InboxSigner } from "@/features/multi-inbox/multi-inbox-client.types";
import { MultiInboxClient } from "@/features/multi-inbox/multi-inbox.client";
import { RELYING_PARTY } from "@/features/onboarding/passkey.constants";

export function createSmartWalletSigner(smartWalletClient: NonNullable<ReturnType<typeof useSmartWallets>['client']>): InboxSigner {
  return {
    getAddress: async () => smartWalletClient.account.address,
    getChainId: () => smartWalletClient.chain?.id,
    getBlockNumber: () => undefined,
    walletType: () => "SCW",
    signMessage: async (message: string) =>
      smartWalletClient.signMessage({ message }),
  };
}

export async function createInboxWithSigner(signer: InboxSigner) {
  return MultiInboxClient.instance.createNewInboxForPrivySmartContractWallet({
    inboxSigner: signer,
  });
}

export { RELYING_PARTY };
```

Now let's update the hooks to be more self-contained and use the shared utils:

```typescript:features/onboarding/hooks/use-signup-with-passkey.ts
import { useSignupWithPasskey as usePrivySignupWithPasskey } from "@privy-io/expo/passkey";
import { usePrivy, useEmbeddedEthereumWallet } from "@privy-io/expo";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import { createUser } from "@/utils/api/users";
import { captureErrorWithToast } from "@/utils/capture-error";
import logger from "@/utils/logger";
import { useEffect } from "react";
import { createSmartWalletSigner, createInboxWithSigner, RELYING_PARTY } from "../utils/passkey-utils";

export function useSignupWithPasskey() {
  const { create: createEmbeddedWallet } = useEmbeddedEthereumWallet();
  const { client: smartWalletClient } = useSmartWallets();
  const { user: privyUser } = usePrivy();

  useEffect(() => {
    if (!smartWalletClient || !privyUser) return;

    async function handleSmartWalletReady() {
      try {
        const signer = createSmartWalletSigner(smartWalletClient);
        const { inboxId } = await createInboxWithSigner(signer);
        const smartContractWalletAddress = await signer.getAddress();
        
        await createUser({
          privyUserId: privyUser.id,
          smartContractWalletAddress,
          inboxId,
        });
      } catch (error) {
        logger.error(`[signup-with-passkey] Error handling smart wallet ready: ${error}`);
        captureErrorWithToast(error);
      }
    }

    handleSmartWalletReady();
  }, [smartWalletClient, privyUser]);

  const { signupWithPasskey: privySignupWithPasskey } = usePrivySignupWithPasskey({
    onSuccess: () => {
      createEmbeddedWallet();
    },
    onError: (error) => {
      logger.error(`[signup-with-passkey] Error signing up: ${error}`);
      captureErrorWithToast(error);
    },
  });

  const signup = async () => {
    await privySignupWithPasskey({
      relyingParty: RELYING_PARTY,
    });
  };

  return { signup };
}
```

```typescript:features/onboarding/hooks/use-login-with-passkey.ts
import { useLoginWithPasskey as usePrivyLoginWithPasskey } from "@privy-io/expo/passkey";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import logger from "@/utils/logger";
import { useEffect } from "react";
import { captureErrorWithToast } from "@/utils/capture-error";
import { createSmartWalletSigner, createInboxWithSigner, RELYING_PARTY } from "../utils/passkey-utils";

export function useLoginWithPasskey() {
  const { client: smartWalletClient } = useSmartWallets();
  const { loginWithPasskey: privyLoginWithPasskey } = usePrivyLoginWithPasskey();

  useEffect(() => {
    if (!smartWalletClient) return;

    async function handleSmartWalletReady() {
      try {
        const signer = createSmartWalletSigner(smartWalletClient);
        await createInboxWithSigner(signer);
      } catch (error) {
        logger.error(`[login-with-passkey] Error handling smart wallet ready: ${error}`);
        captureErrorWithToast(error);
      }
    }

    handleSmartWalletReady();
  }, [smartWalletClient]);

  const login = async () => {
    await privyLoginWithPasskey({
      relyingParty: RELYING_PARTY,
    });
  };

  return { login };
}
```

Key improvements:
1. Created shared utilities for common functionality
2. Moved smart wallet handling into useEffect hooks that run automatically
3. Added proper error handling in the effects
4. Simplified the public API of both hooks to just `signup` and `login`
5. Made the hooks more self-contained - consumers don't need to know about smart wallet handling
6. Added TypeScript type safety for the smart wallet client
7. Consistent error handling and logging patterns

Now components can simply use the hooks like this:

```typescript
const { signup } = useSignupWithPasskey();
// or
const { login } = useLoginWithPasskey();
```

The smart wallet handling happens automatically when the conditions are right, and consumers don't need to worry about that implementation detail.

---



---

