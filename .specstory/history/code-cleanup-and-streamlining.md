## SpecStory

## Code Cleanup and Streamlining (1/28/2025, 2:25:01 PM)

_**User**_

remove all the stuff we don't use anymore since we exported in other files

---

_**Assistant**_

I'll help clean up the file by removing unused code and keeping only the essential parts. Based on the code style guide and the fact that some functionality has been moved to other files, here's the simplified version with the necessary parts:

```typescript:features/streams/streams.ts
import { getAccountsList } from "@/data/store/accountsStore";
import { useAppStore } from "@/data/store/appStore";
import { useAppState } from "@/data/store/use-app-state-store";
import { setupAccountTopicSubscription } from "@/features/notifications/utils/accountTopicSubscription";
import { captureError } from "@/utils/capture-error";
import { stopStreamingConversations } from "@/utils/xmtpRN/xmtp-conversations/xmtp-conversations-stream";
import { stopStreamingAllMessage } from "@/utils/xmtpRN/xmtp-messages/xmtp-messages-stream";
import { stopStreamingConsent } from "@/utils/xmtpRN/xmtp-preferences/xmtp-preferences-stream";
import { appStateIsBlurredState } from "@utils/appState/appStateIsBlurred";
import logger from "@utils/logger";
import { create } from "zustand";
import { startConsentStreaming } from "./stream-consent";
import { startConversationStreaming } from "./stream-conversations";
import { startMessageStreaming } from "./stream-messages";

// ... existing StreamingState and State types ...

type StoreActions = {
  updateStreamingState: (account: string, updates: Partial<StreamingState>) => void;
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

export async function startStreaming(accountsToStream: string[]) {
  for (const account of accountsToStream) {
    const streamingState =
      useStreamingStore.getState().accountStreamingStates[account];

    if (!streamingState?.isStreamingConversations) {
      await startConversationStreaming(account).catch(captureError);
    }

    if (!streamingState?.isStreamingMessages) {
      await startMessageStreaming(account).catch(captureError);
    }

    if (!streamingState?.isStreamingConsent) {
      await startConsentStreaming(account).catch(captureError);
    }

    setupAccountTopicSubscription(account);
  }
}

export async function stopStreaming(accounts: string[]) {
  const store = useStreamingStore.getState();

  await Promise.all(
    accounts.map(async (account) => {
      try {
        await Promise.all([
          stopStreamingAllMessage({ ethAddress: account }),
          stopStreamingConversations({ ethAddress: account }),
          stopStreamingConsent(account),
        ]);
      } finally {
        store.actions.resetAccount(account);
      }
    })
  );
}

// ... existing AppState event listener and store subscriptions ...
```

I've removed:
1. All the message handling functions (`onNewMessage`, `onNewConversation`, `handleNewGroupUpdatedMessage`) since they appear to have been moved elsewhere
2. Unused imports related to those removed functions
3. The `METADATA_FIELD_MAP` constant and related types

I kept:
1. The streaming store and its types
2. Core streaming control functions (`startStreaming` and `stopStreaming`)
3. App state management and subscriptions
4. Essential imports

The core functionality for managing streaming states and controlling streams remains intact, while the message handling logic has been moved to more appropriate locations.

---



---

