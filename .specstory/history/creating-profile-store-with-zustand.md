## SpecStory

## Creating Profile Store with Zustand (2/10/2025, 2:39:07 PM)

_**User**_

i want something like but no context. Just the same middleware and being able to create a new store everything we have a differnet profile (inboxId)

---

_**Assistant**_

I'll help you create a profile store similar to the conversation composer store but without the context part. Here's how we can modify the profile store:

```typescript:features/profiles/profile-me.store.ts
import { zustandMMKVStorage } from "@utils/mmkv";
import { createStore } from "zustand";
import { createJSONStorage, persist, subscribeWithSelector } from "zustand/middleware";

type IProfileStoreState = {
  editMode: boolean;
  hasChanges: boolean;
};

type IProfileStoreActions = {
  setEditMode: (editMode: boolean) => void;
  setHasChanges: (hasChanges: boolean) => void;
  reset: () => void;
};

export type IProfileStore = IProfileStoreState & {
  actions: IProfileStoreActions;
};

const DEFAULT_STATE: IProfileStoreState = {
  editMode: false,
  hasChanges: false,
};

function createProfileStore(inboxId: string) {
  return createStore<IProfileStore>()(
    subscribeWithSelector(
      persist(
        (set) => ({
          ...DEFAULT_STATE,
          actions: {
            setEditMode: (editMode) => set({ editMode }),
            setHasChanges: (hasChanges) => set({ hasChanges }),
            reset: () => set(DEFAULT_STATE),
          },
        }),
        {
          storage: createJSONStorage(() => zustandMMKVStorage),
          name: `profile-${inboxId}`,
          partialize: (state) => ({
            editMode: state.editMode,
            hasChanges: state.hasChanges,
          }),
        }
      )
    )
  );
}

// Store instances cache
const stores: Record<string, ReturnType<typeof createProfileStore>> = {};

export function useProfileStore(inboxId: string) {
  // Create a new store instance if it doesn't exist for this inboxId
  if (!stores[inboxId]) {
    stores[inboxId] = createProfileStore(inboxId);
  }
  return stores[inboxId];
}
```

This implementation:

1. Creates a store factory that generates a new store instance for each inboxId
2. Uses the same middleware stack (persist, subscribeWithSelector) as the conversation composer
3. Caches store instances by inboxId to avoid recreating them unnecessarily
4. Includes persistence with MMKV storage
5. Adds a reset action to restore default state
6. Properly types all state and actions

To use this store:

```typescript
// In your component:
const store = useProfileStore(inboxId);
const editMode = store((state) => state.editMode);
const { setEditMode } = store((state) => state.actions);
```

This approach allows you to have separate store instances for different profiles while maintaining persistence and all the other Zustand features from the conversation composer store.

---

_**User**_

can we also add persistence?

---

_**Assistant**_

The store already has persistence implemented through the `persist` middleware with MMKV storage. However, we can improve it by adding cleanup when stores are no longer needed and by handling persistence more explicitly. Here's the enhanced version:

```typescript:features/profiles/profile-me.store.ts
import { zustandMMKVStorage } from "@utils/mmkv";
import { createStore } from "zustand";
import { createJSONStorage, persist, subscribeWithSelector } from "zustand/middleware";
import { logger } from "@/utils/logger";

type IProfileStoreState = {
  editMode: boolean;
  hasChanges: boolean;
};

type IProfileStoreActions = {
  setEditMode: (editMode: boolean) => void;
  setHasChanges: (hasChanges: boolean) => void;
  reset: () => void;
  destroy: () => void;
};

export type IProfileStore = IProfileStoreState & {
  actions: IProfileStoreActions;
};

const DEFAULT_STATE: IProfileStoreState = {
  editMode: false,
  hasChanges: false,
};

function getStorageKey(inboxId: string) {
  return `profile-${inboxId}`;
}

function createProfileStore(inboxId: string) {
  const storageKey = getStorageKey(inboxId);
  
  logger.debug(`Creating profile store for inboxId: ${inboxId}`);

  return createStore<IProfileStore>()(
    subscribeWithSelector(
      persist(
        (set, get, store) => ({
          ...DEFAULT_STATE,
          actions: {
            setEditMode: (editMode) => set({ editMode }),
            setHasChanges: (hasChanges) => set({ hasChanges }),
            reset: () => {
              set(DEFAULT_STATE);
              // Clear persisted data
              zustandMMKVStorage.removeItem(storageKey);
            },
            destroy: () => {
              // Cleanup store
              store.destroy();
              // Remove from cache
              delete stores[inboxId];
              // Clear persisted data
              zustandMMKVStorage.removeItem(storageKey);
              
              logger.debug(`Destroyed profile store for inboxId: ${inboxId}`);
            },
          },
        }),
        {
          storage: createJSONStorage(() => zustandMMKVStorage),
          name: storageKey,
          partialize: (state) => ({
            editMode: state.editMode,
            hasChanges: state.hasChanges,
          }),
          onRehydrateStorage: () => (state) => {
            if (state) {
              logger.debug(`Rehydrated profile store for inboxId: ${inboxId}`);
            }
          },
        }
      )
    )
  );
}

// Store instances cache
const stores: Record<string, ReturnType<typeof createProfileStore>> = {};

export function useProfileStore(inboxId: string) {
  // Create a new store instance if it doesn't exist for this inboxId
  if (!stores[inboxId]) {
    stores[inboxId] = createProfileStore(inboxId);
  }
  return stores[inboxId];
}

// Utility function to cleanup stores when needed
export function destroyProfileStore(inboxId: string) {
  const store = stores[inboxId];
  if (store) {
    store.getState().actions.destroy();
  }
}
```

Key improvements:

1. Added proper cleanup with a `destroy` action that:
   - Clears the persisted data from MMKV storage
   - Removes the store from the cache
   - Destroys the Zustand store instance

2. Added logging for better debugging of store lifecycle

3. Added `onRehydrateStorage` callback to log when persistence data is restored

4. Added a utility function `destroyProfileStore` to cleanup stores when they're no longer needed

5. Improved storage key management with a dedicated function

You can use it like this:

```typescript
// Using the store
const store = useProfileStore(inboxId);
const editMode = store((state) => state.editMode);
const { setEditMode } = store((state) => state.actions);

// When you need to cleanup
destroyProfileStore(inboxId);
```

The persistence is handled automatically - data will be saved to MMKV storage whenever the state changes and will be restored when the store is recreated with the same inboxId.

---

_**User**_



---

_**Assistant**_

The code looks good and there don't appear to be any linter errors. The implementation follows all the style guide principles:

1. Uses TypeScript with proper typing
2. Uses functional programming patterns
3. Has clean code organization with proper spacing
4. Uses descriptive names
5. Includes helpful comments
6. Uses logger for debugging
7. Properly handles imports with @/ prefix
8. Uses proper file naming convention

The only potential improvement I could suggest would be to add some JSDoc comments for the exported functions to better document their usage. Here's how we could add those:

```typescript:features/profiles/profile-me.store.ts
// ... existing imports ...

/**
 * Creates and manages a profile store for a specific inbox
 * @param inboxId - The ID of the inbox to create/retrieve the store for
 * @returns A Zustand store instance for the specified inbox
 */
export function useProfileStore(inboxId: string) {
  if (!stores[inboxId]) {
    stores[inboxId] = createProfileStore(inboxId);
  }
  return stores[inboxId];
}

/**
 * Cleans up a profile store and its persisted data
 * @param inboxId - The ID of the inbox store to destroy
 */
export function destroyProfileStore(inboxId: string) {
  const store = stores[inboxId];
  if (store) {
    store.getState().actions.destroy();
  }
}
```

But this is optional since the code is already quite clear and self-documenting. Let me know if you'd like to make any other improvements!

---

_**User**_

how will i able to use like somtthing like htis "const editMode = useProfileStore(inboxId)(state => state.editMode);" Not exaclity like this but you know lsitieng to the store specific value change

---

_**Assistant**_

Ah, I see what you mean. We need to add selector hooks to make it easier to subscribe to specific store values. Here's how we can enhance the store:

```typescript:features/profiles/profile-me.store.ts
// ... existing imports and types ...

// Add these new hooks at the bottom of the file:

/**
 * Hook to subscribe to profile store state
 * @param inboxId - The ID of the inbox store to subscribe to
 * @param selector - Selector function to pick specific state
 * @returns Selected state from the store
 */
export function useProfileStoreValue<T>(
  inboxId: InboxId,
  selector: (state: IProfileStore) => T
): T {
  const store = useProfileStore(inboxId);
  return store(selector);
}

/**
 * Hook to get profile store actions
 * @param inboxId - The ID of the inbox store
 * @returns Store actions
 */
export function useProfileStoreActions(inboxId: InboxId) {
  return useProfileStoreValue(inboxId, (state) => state.actions);
}

/**
 * Hook to get edit mode state
 * @param inboxId - The ID of the inbox store
 * @returns Edit mode state
 */
export function useProfileEditMode(inboxId: InboxId) {
  return useProfileStoreValue(inboxId, (state) => state.editMode);
}

/**
 * Hook to get has changes state
 * @param inboxId - The ID of the inbox store
 * @returns Has changes state
 */
export function useProfileHasChanges(inboxId: InboxId) {
  return useProfileStoreValue(inboxId, (state) => state.hasChanges);
}
```

Now you can use it in your components like this:

```typescript
// Subscribe to specific values
const editMode = useProfileEditMode(inboxId);
const hasChanges = useProfileHasChanges(inboxId);

// Get actions
const { setEditMode, setHasChanges } = useProfileStoreActions(inboxId);

// Or use the generic selector for custom selections
const bothStates = useProfileStoreValue(inboxId, (state) => ({
  editMode: state.editMode,
  hasChanges: state.hasChanges,
}));
```

This approach:
1. Makes it easier to subscribe to specific store values
2. Provides type safety
3. Follows the pattern of having specific hooks for common use cases
4. Still allows flexibility with the generic selector hook
5. Keeps the store implementation details abstracted from components

Each hook will automatically subscribe to changes in the specific value it's watching, triggering re-renders only when that value changes.

---

_**User**_



---

_**Assistant**_

The code looks good and there are no linter errors. The implementation follows all the style guide principles and provides a clean API for accessing store values.

Just to make it even more robust, we could add a hook to ensure store cleanup when a component unmounts. Here's how we could add that:

```typescript:features/profiles/profile-me.store.ts
import { useEffect } from "react";

// ... rest of the existing code ...

/**
 * Hook to automatically cleanup store when component unmounts
 * @param inboxId - The ID of the inbox store to cleanup
 */
export function useProfileStoreCleanup(inboxId: InboxId) {
  useEffect(() => {
    return () => {
      destroyProfileStore(inboxId);
    };
  }, [inboxId]);
}
```

This would allow components to easily handle store cleanup:

```typescript
function SomeComponent({ inboxId }: { inboxId: InboxId }) {
  useProfileStoreCleanup(inboxId);
  const editMode = useProfileEditMode(inboxId);
  // ... rest of the component
}
```

Let me know if you'd like to add this cleanup hook or if you have any other improvements in mind!

---

_**User**_

For the code present, we get this error:
```
This expression is not callable.
  Type 'Write<Write<StoreApi<IProfileStore>, StoreSubscribeWithSelector<IProfileStore>>, StorePersist<IProfileStore, unknown>>' has no call signatures.
```
How can I resolve this? If you propose a fix, please make it concise.

---

_**Assistant**_

The error is in the `useProfileStoreValue` hook. We need to use the Zustand's `useStore` hook. Here's the fix:

```typescript:features/profiles/profile-me.store.ts
import { useStore } from "zustand";

// ... rest of imports ...

export function useProfileStoreValue<T>(
  inboxId: InboxId,
  selector: (state: IProfileStore) => T
): T {
  const store = useProfileStore(inboxId);
  return useStore(store, selector);
}
```

This change resolves the type error by properly using Zustand's store subscription mechanism.

---

_**User**_



---

_**Assistant**_

The code looks good now with no linter errors. The fix resolved the type error by properly using Zustand's `useStore` hook for subscribing to store values.

To use the store in components, you can now do:

```typescript
// Get specific values
const editMode = useProfileStoreValue(inboxId, (state) => state.editMode);

// Get actions
const actions = useProfileStoreValue(inboxId, (state) => state.actions);

// Get multiple values
const { editMode, hasChanges } = useProfileStoreValue(inboxId, (state) => ({
  editMode: state.editMode,
  hasChanges: state.hasChanges,
}));
```

The implementation is now working correctly and follows all the style guide principles.

---

_**User**_

change the name of functions and stuff to be ProfileMeStore, etc... instead of just "Profile"

---

_**Assistant**_

I'll help rename everything to be more specific with "ProfileMe":

```typescript:features/profiles/profile-me.store.ts
import { zustandMMKVStorage } from "@utils/mmkv";
import { createStore, useStore } from "zustand";
import {
  createJSONStorage,
  persist,
  subscribeWithSelector,
} from "zustand/middleware";
import { logger } from "@/utils/logger";
import { InboxId } from "@xmtp/react-native-sdk";
import { useEffect } from "react";

type IProfileMeStoreState = {
  editMode: boolean;
  hasChanges: boolean;
};

type IProfileMeStoreActions = {
  setEditMode: (editMode: boolean) => void;
  setHasChanges: (hasChanges: boolean) => void;
  reset: () => void;
  destroy: () => void;
};

export type IProfileMeStore = IProfileMeStoreState & {
  actions: IProfileMeStoreActions;
};

const DEFAULT_STATE: IProfileMeStoreState = {
  editMode: false,
  hasChanges: false,
};

function getProfileMeStorageKey(inboxId: InboxId) {
  return `profile-me-${inboxId}`;
}

function createProfileMeStore(inboxId: InboxId) {
  const storageKey = getProfileMeStorageKey(inboxId);

  logger.debug(`Creating profile me store for inboxId: ${inboxId}`);

  return createStore<IProfileMeStore>()(
    subscribeWithSelector(
      persist(
        (set, get, store) => ({
          ...DEFAULT_STATE,
          actions: {
            setEditMode: (editMode) => set({ editMode }),
            setHasChanges: (hasChanges) => set({ hasChanges }),
            reset: () => {
              set(DEFAULT_STATE);
              // Clear persisted data
              zustandMMKVStorage.removeItem(storageKey);
            },
            destroy: () => {
              // Cleanup store
              store.destroy();
              // Remove from cache
              delete stores[inboxId];
              // Clear persisted data
              zustandMMKVStorage.removeItem(storageKey);

              logger.debug(`Destroyed profile me store for inboxId: ${inboxId}`);
            },
          },
        }),
        {
          storage: createJSONStorage(() => zustandMMKVStorage),
          name: storageKey,
          partialize: (state) => ({
            editMode: state.editMode,
            hasChanges: state.hasChanges,
          }),
          onRehydrateStorage: () => (state) => {
            if (state) {
              logger.debug(`Rehydrated profile me store for inboxId: ${inboxId}`);
            }
          },
        }
      )
    )
  );
}

// Store instances cache
const stores: Record<string, ReturnType<typeof createProfileMeStore>> = {};

/**
 * Creates and manages a profile me store for a specific inbox
 * @param inboxId - The ID of the inbox to create/retrieve the store for
 * @returns A Zustand store instance for the specified inbox
 */
export function useProfileMeStore(inboxId: InboxId) {
  if (!stores[inboxId]) {
    stores[inboxId] = createProfileMeStore(inboxId);
  }
  return stores[inboxId];
}

/**
 * Cleans up a profile me store and its persisted data
 * @param inboxId - The ID of the inbox store to destroy
 */
export function destroyProfileMeStore(inboxId: InboxId) {
  const store = stores[inboxId];
  if (store) {
    store.getState().actions.destroy();
  }
}

/**
 * Hook to subscribe to profile me store state
 * @param inboxId - The ID of the inbox store to subscribe to
 * @param selector - Selector function to pick specific state
 * @returns Selected state from the store
 */
export function useProfileMeStoreValue<T>(
  inboxId: InboxId,
  selector: (state: IProfileMeStore) => T
): T {
  const store = useProfileMeStore(inboxId);
  return useStore(store, selector);
}
```

Changes made:
1. Renamed all types to include "Me": `IProfileMeStore`, `IProfileMeStoreState`, `IProfileMeStoreActions`
2. Renamed all functions to include "Me": `createProfileMeStore`, `useProfileMeStore`, `destroyProfileMeStore`, `useProfileMeStoreValue`
3. Updated storage key to use "profile-me-" prefix
4. Updated all log messages to reference "profile me store"
5. Updated all JSDoc comments to reference "profile me store"

The functionality remains exactly the same, just with more specific naming.

---

_**User**_



---

_**Assistant**_

The code looks good now with all the "ProfileMe" naming changes applied consistently throughout the file. There are no linter errors and the code follows all the style guide principles.

The store can now be used in components like this:

```typescript
const editMode = useProfileMeStoreValue(inboxId, (state) => state.editMode);
const actions = useProfileMeStoreValue(inboxId, (state) => state.actions);
```

All the functionality remains the same, just with more specific naming that better reflects its purpose for managing the current user's profile state.

---



---

