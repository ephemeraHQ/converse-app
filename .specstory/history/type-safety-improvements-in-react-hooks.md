## SpecStory

## Type Safety Improvements in React Hooks (2/12/2025, 11:24:50 AM)

_**User**_

@use-execute-once-when-ready.ts seems okay but on see in @use-signup-with-passkey.ts i still need the if(!smart... because otherwise the rest thinks smartwalletclient can be undeefined but it can't be because the callback only execute once it'S ready... amybe we can add some tpying fix? Or maybe antoher arguments?

---

_**Assistant**_

I understand the issue. We can improve the `useExecuteOnceWhenReady` hook by adding type checking that ensures the dependencies are not falsy when the callback executes. Here's how we can modify it:

```typescript:hooks/use-execute-once-when-ready.ts
import { useEffect, useRef } from "react";

type Falsy = false | 0 | "" | null | undefined;

// Helper type that removes Falsy from a type
type NonFalsy<T> = Exclude<T, Falsy>;

export function useExecuteOnceWhenReady<T extends unknown[]>(
  // The callback receives the non-falsy dependencies as arguments
  callback: (...args: { [K in keyof T]: NonFalsy<T[K]> }) => Promise<void> | void,
  dependencies: [...T]
) {
  const hasRun = useRef(false);

  useEffect(() => {
    const isReady = dependencies.every((dep) => Boolean(dep));

    if (isReady && !hasRun.current) {
      hasRun.current = true;
      // TypeScript now knows these values are non-falsy
      const nonFalsyDeps = dependencies.filter(Boolean) as { [K in keyof T]: NonFalsy<T[K]> };
      callback(...nonFalsyDeps);
    }
    // We intentionally only want to check the dependencies array values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies]);
}
```

Now we can update the usage in `useSignupWithPasskey`:

```typescript:features/onboarding/hooks/use-signup-with-passkey.ts
// ... existing imports ...

export function useSignupWithPasskey() {
  // ... existing code ...

  useExecuteOnceWhenReady(
    // TypeScript now knows these parameters are non-null
    async (smartWalletClient, privyUser) => {
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

  // ... rest of the code ...
}
```

The key changes are:
1. Added generic type parameter to infer the dependency types
2. Made the callback receive the non-falsy dependencies as arguments
3. Added type helper `NonFalsy` to remove falsy types from the dependency types
4. Updated the implementation to pass the non-falsy dependencies to the callback

Now TypeScript knows that when the callback executes, all dependencies are non-falsy, eliminating the need for the null check. The hook is also more type-safe and reusable in other situations.

---

_**User**_

also i prefer obecjt args. like {callbakc:.. , deps: ...}

---

_**Assistant**_

I'll modify the hook to use object arguments for better readability and maintainability.

```typescript:hooks/use-execute-once-when-ready.ts
import { useEffect, useRef } from "react";

type Falsy = false | 0 | "" | null | undefined;

// Helper type that removes Falsy from a type
type NonFalsy<T> = Exclude<T, Falsy>;

type UseExecuteOnceWhenReadyArgs<T extends unknown[]> = {
  callback: (...args: { [K in keyof T]: NonFalsy<T[K]> }) => Promise<void> | void;
  deps: [...T];
};

export function useExecuteOnceWhenReady<T extends unknown[]>({
  callback,
  deps,
}: UseExecuteOnceWhenReadyArgs<T>) {
  const hasRun = useRef(false);

  useEffect(() => {
    const isReady = deps.every((dep) => Boolean(dep));

    if (isReady && !hasRun.current) {
      hasRun.current = true;
      // TypeScript now knows these values are non-falsy
      const nonFalsyDeps = deps.filter(Boolean) as {
        [K in keyof T]: NonFalsy<T[K]>;
      };
      callback(...nonFalsyDeps);
    }
    // We intentionally only want to check the dependencies array values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);
}
```

And here's how we would update the usage in `useSignupWithPasskey`:

```typescript:features/onboarding/hooks/use-signup-with-passkey.ts
  useExecuteOnceWhenReady({
    callback: async (smartWalletClient, privyUser) => {
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
    deps: [smartWalletClient, privyUser],
  });
```

This change makes the hook usage more explicit and follows our code style guide's preference for object parameters. The functionality remains the same, but the code is now more readable and maintainable.

---



---

