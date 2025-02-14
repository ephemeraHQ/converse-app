## SpecStory

## Zustand Store Organization in TypeScript (1/28/2025, 2:32:23 PM)

_**User**_

put the zustand store insdie stream-store.ts

---

_**Assistant**_

I'll help you create a new `stream-store.ts` file for the Zustand store. Here's how to extract and organize the store code:

```typescript:features/streams/stream-store.ts
import { create } from "zustand";

type StreamingState = {
  isStreamingConversations: boolean;
  isStreamingMessages: boolean;
  isStreamingConsent: boolean;
};

type State = {
  accountStreamingStates: Record<string, StreamingState>;
};

type StoreActions = {
  updateStreamingState: (
    account: string,
    updates: Partial<StreamingState>
  ) => void;
  resetAccount: (account: string) => void;
};

export const useStreamingStore = create<State & { actions: StoreActions }>(
  (set) => ({
    accountStreamingStates: {},
    actions: {
      updateStreamingState: (account, updates) =>
        set((state) => ({
          accountStreamingStates: {
            ...state.accountStreamingStates,
            [account]: {
              ...state.accountStreamingStates[account],
              ...updates,
            },
          },
        })),
      resetAccount: (account) =>
        set((state) => {
          const { [account]: _, ...rest } = state.accountStreamingStates;
          return { accountStreamingStates: rest };
        }),
    },
  })
);
```

Then update the original file to import the store:

```typescript:features/streams/streams.ts
import { useStreamingStore } from "./stream-store";
// ... existing code ...
```

This change:
1. Creates a new file `stream-store.ts` containing just the Zustand store definition
2. Moves the types and store creation code to the new file
3. Adds an import statement in the original file to reference the store
4. Follows the style guide by keeping related code together and maintaining clean file organization

The rest of the original file remains unchanged.

---



---

