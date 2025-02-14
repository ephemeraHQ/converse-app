## SpecStory

## Custom useEffect Hook for One-Time Execution (2/12/2025, 11:22:26 AM)

_**User**_

how can i have a custom general hook useEffect where i want to only execute once ? like fro example here when smartWalletClient and privyUser are set, i want to execute something. But i only want to execute the something once!

---

_**Assistant**_

I'll help you create a custom hook for one-time execution when certain dependencies are ready. For your specific case, we can create a `useOnceWhenReady` hook.

Here's how we can modify your code:

First, let's create a new utility hook:

```typescript:@/hooks/use-once-when-ready.ts
import { useEffect, useRef } from "react";

type Falsy = false | 0 | "" | null | undefined;

export function useOnceWhenReady(
  callback: () => Promise<void> | void,
  dependencies: (unknown | Falsy)[]
) {
  const hasRun = useRef(false);

  useEffect(() => {
    const isReady = dependencies.every((dep) => Boolean(dep));
    
    if (isReady && !hasRun.current) {
      hasRun.current = true;
      callback();
    }
  }, dependencies);
}
```

Then modify your signup hook to use it:

```typescript:features/onboarding/hooks/use-signup-with-passkey.ts
import { useSignupWithPasskey as usePrivySignupWithPasskey } from "@privy-io/expo/passkey";
import { usePrivy, useEmbeddedEthereumWallet } from "@privy-io/expo";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import { createUser } from "@/utils/api/users";
import { captureErrorWithToast } from "@/utils/capture-error";
import logger from "@/utils/logger";
import { useCallback } from "react";
import {
  createSmartWalletSigner,
  createInboxWithSigner,
  RELYING_PARTY,
} from "../utils/passkey-utils";
import { useOnceWhenReady } from "@/hooks/use-once-when-ready";

export function useSignupWithPasskey() {
  const { create: createEmbeddedWallet } = useEmbeddedEthereumWallet();
  const { client: smartWalletClient } = useSmartWallets();
  const { user: privyUser } = usePrivy();

  const { signupWithPasskey: privySignupWithPasskey } =
    usePrivySignupWithPasskey({
      onSuccess: () => {
        createEmbeddedWallet();
      },
      onError: (error) => {
        logger.error(`[signup-with-passkey] Error signing up: ${error}`);
        captureErrorWithToast(error);
      },
    });

  useOnceWhenReady(
    async () => {
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
        logger.error(
          `[signup-with-passkey] Error handling smart wallet ready: ${error}`
        );
        captureErrorWithToast(error);
      }
    },
    [smartWalletClient, privyUser]
  );

  const signup = useCallback(async () => {
    await privySignupWithPasskey({
      relyingParty: RELYING_PARTY,
    });
  }, [privySignupWithPasskey]);

  return { signup };
}
```

The `useOnceWhenReady` hook:
1. Takes a callback function and an array of dependencies
2. Uses a ref to track if the callback has been executed
3. Only executes the callback when:
   - All dependencies are truthy (ready)
   - The callback hasn't been executed before

This ensures your initialization code only runs once, even if the dependencies change multiple times after the initial execution.

You can reuse this hook anywhere you need similar one-time execution behavior when certain dependencies become available.

---

_**User**_

For the code present, we get this error:
```
React Hook useEffect has missing dependencies: 'callback' and 'dependencies'. Either include them or remove the dependency array. If 'callback' changes too often, find the parent component that defines it and wrap that definition in useCallback.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

Here's the fix for the `useOnceWhenReady` hook:

```typescript:hooks/use-once-when-ready.ts
import { useEffect, useRef } from "react";

type Falsy = false | 0 | "" | null | undefined;

export function useOnceWhenReady(
  callback: () => Promise<void> | void,
  dependencies: (unknown | Falsy)[]
) {
  const hasRun = useRef(false);

  useEffect(() => {
    const isReady = dependencies.every((dep) => Boolean(dep));
    
    if (isReady && !hasRun.current) {
      hasRun.current = true;
      callback();
    }
  // We intentionally only want to check the dependencies array values
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies]);
}
```

The key changes:
1. Changed `dependencies` to `[...dependencies]` to make it an array literal
2. Added an eslint disable comment since we intentionally don't want to include `callback` in deps (to prevent re-runs)

---



---

