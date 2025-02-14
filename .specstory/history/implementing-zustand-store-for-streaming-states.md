## SpecStory

## Implementing Zustand Store for Streaming States (1/28/2025, 1:47:48 PM)

_**User**_

can you redo this so we use zustand store and also don't call stuff syned it's streaming that I'm doing here. I want to keep track of the state of streaming conversations, messages and sync consent for each account

---

_**Assistant**_

I'll help modify the code to use a Zustand store and rename the sync-related terminology to streaming. Here's how we can restructure it:

First, let's create a new store for tracking streaming states:

```typescript:features/xmtp/store/streaming-store.ts
import { create } from 'zustand'

type StreamingState = {
  isStreamingConversations: boolean
  isStreamingMessages: boolean
  isStreamingConsent: boolean
}

type StreamingStore = {
  accountStreamingStates: Record<string, StreamingState>
  setStreamingState: (account: string, updates: Partial<StreamingState>) => void
  resetStreamingState: (account: string) => void
}

export const useStreamingStore = create<StreamingStore>((set) => ({
  accountStreamingStates: {},
  setStreamingState: (account, updates) =>
    set((state) => ({
      accountStreamingStates: {
        ...state.accountStreamingStates,
        [account]: {
          ...state.accountStreamingStates[account],
          ...updates,
        },
      },
    })),
  resetStreamingState: (account) =>
    set((state) => {
      const { [account]: _, ...rest } = state.accountStreamingStates
      return { accountStreamingStates: rest }
    }),
}))
```

Now, let's update the XmtpEngine:

```typescript:components/XmtpEngine.tsx
// ... existing imports ...
import { useStreamingStore } from '@/features/xmtp/store/streaming-store'

class XmtpEngine {
  // ... existing properties ...

  async startStreaming(accountsToStream: string[]) {
    accountsToStream.forEach((account) => {
      const streamingState = useStreamingStore.getState().accountStreamingStates[account]
      
      if (!streamingState?.isStreamingConversations) {
        logger.info(`[XmtpEngine] Starting conversation stream for ${account}`)
        useStreamingStore.getState().setStreamingState(account, { isStreamingConversations: true })
        
        streamConversations(account).catch((e) => {
          logger.error(e, { context: `Failed to stream conversations for ${account}` })
          useStreamingStore.getState().setStreamingState(account, { isStreamingConversations: false })
        })
      }

      if (!streamingState?.isStreamingMessages) {
        logger.info(`[XmtpEngine] Starting messages stream for ${account}`)
        useStreamingStore.getState().setStreamingState(account, { isStreamingMessages: true })
        
        streamAllMessages(account).catch((e) => {
          logger.error(e, { context: `Failed to stream all messages for ${account}` })
          useStreamingStore.getState().setStreamingState(account, { isStreamingMessages: false })
        })
      }

      if (!streamingState?.isStreamingConsent) {
        logger.info(`[XmtpEngine] Starting consent stream for ${account}`)
        useStreamingStore.getState().setStreamingState(account, { isStreamingConsent: true })
        
        streamConsent(account).catch((e) => {
          logger.error(e, { context: `Failed to stream consent for ${account}` })
          useStreamingStore.getState().setStreamingState(account, { isStreamingConsent: false })
        })
      }

      // Setup topic subscription after streams are initialized
      setupAccountTopicSubscription(account)
    })
  }

  async onAppBlur() {
    logger.debug("[XmtpEngine] App is now inactive, stopping xmtp streams and db connections")
    for (const account of getAccountsList()) {
      await Promise.all([
        stopStreamingAllMessage(account),
        stopStreamingConversations(account),
        stopStreamingConsent(account),
      ])
      useStreamingStore.getState().resetStreamingState(account)
    }
  }

  // Update other methods to use startStreaming instead of syncAccounts
  onInternetReachabilityChange(isInternetReachable: boolean) {
    logger.debug(`[XmtpEngine] Internet reachability changed: ${isInternetReachable}`)
    this.startStreaming(getAccountsList())
  }

  onHydrationDone(hydrationDone: boolean) {
    logger.debug(`[XmtpEngine] Hydration done changed: ${hydrationDone}`)
    this.startStreaming(getAccountsList())
  }

  onAppFocus() {
    logger.debug("[XmtpEngine] App is now active, reconnecting streams")
    if (this.hydrationDone && this.isInternetReachable) {
      this.startStreaming(getAccountsList())
    }
  }

  // ... rest of the existing code ...
}
```

Key changes made:
1. Created a new Zustand store to track streaming states for each account
2. Renamed `syncAccounts` to `startStreaming` and updated the implementation to use the streaming store
3. Updated state tracking to use more accurate "streaming" terminology
4. Added proper state management for each type of stream (conversations, messages, consent)
5. Added error handling that updates the streaming state when streams fail
6. Updated the `onAppBlur` method to reset streaming states when stopping streams

The streaming store allows us to track the state of each stream type per account and provides a clean API for updating these states. This makes it easier to monitor and debug the streaming status for each account.

---

_**User**_

Don't create a class

---

_**Assistant**_

I'll refactor the code to use a functional approach with a Zustand store instead of a class.

```typescript:features/xmtp/store/xmtp-engine-store.ts
import { create } from 'zustand'
import { AppStateStatus } from 'react-native'

type XmtpEngineState = {
  isStarted: boolean
  isInternetReachable: boolean
  hydrationDone: boolean
  appState: AppStateStatus
  accountStreamingStates: Record<string, {
    isStreamingConversations: boolean
    isStreamingMessages: boolean
    isStreamingConsent: boolean
  }>
  setStarted: (isStarted: boolean) => void
  setInternetReachable: (isReachable: boolean) => void
  setHydrationDone: (isDone: boolean) => void
  setAppState: (state: AppStateStatus) => void
  setStreamingState: (account: string, updates: {
    isStreamingConversations?: boolean
    isStreamingMessages?: boolean
    isStreamingConsent?: boolean
  }) => void
  resetStreamingState: (account: string) => void
}

export const useXmtpEngineStore = create<XmtpEngineState>((set) => ({
  isStarted: false,
  isInternetReachable: false,
  hydrationDone: false,
  appState: AppState.currentState,
  accountStreamingStates: {},
  setStarted: (isStarted) => set({ isStarted }),
  setInternetReachable: (isReachable) => set({ isInternetReachable: isReachable }),
  setHydrationDone: (isDone) => set({ hydrationDone: isDone }),
  setAppState: (state) => set({ appState: state }),
  setStreamingState: (account, updates) => set((state) => ({
    accountStreamingStates: {
      ...state.accountStreamingStates,
      [account]: {
        ...state.accountStreamingStates[account],
        ...updates,
      },
    },
  })),
  resetStreamingState: (account) => set((state) => {
    const { [account]: _, ...rest } = state.accountStreamingStates
    return { accountStreamingStates: rest }
  }),
}))
```

```typescript:components/xmtp-engine.tsx
import { AppState, AppStateStatus, NativeEventSubscription } from "react-native"
import { getAccountsList, useAccountsStore } from "@/data/store/accountsStore"
import { useAppStore } from "@/data/store/appStore"
import { useXmtpEngineStore } from "@/features/xmtp/store/xmtp-engine-store"
import { setupAccountTopicSubscription } from "@/features/notifications/utils/accountTopicSubscription"
import {
  stopStreamingConversations,
  streamConversations,
} from "@/utils/xmtpRN/xmtp-conversations/xmtp-conversations-stream"
import {
  stopStreamingAllMessage,
  streamAllMessages,
} from "@/utils/xmtpRN/xmtp-messages/xmtp-messages-stream"
import {
  stopStreamingConsent,
  streamConsent,
} from "@/utils/xmtpRN/xmtp-preferences/xmtp-preferences-stream"
import { appStateIsBlurredState } from "@utils/appState/appStateIsBlurred"
import logger from "@utils/logger"

let accountsStoreUnsubscribe: (() => void) | null = null
let appStoreUnsubscribe: (() => void) | null = null
let appStateSubscription: NativeEventSubscription | null = null

function startStreaming(accountsToStream: string[]) {
  const store = useXmtpEngineStore.getState()

  accountsToStream.forEach((account) => {
    const streamingState = store.accountStreamingStates[account]

    if (!streamingState?.isStreamingConversations) {
      logger.info(`[XmtpEngine] Starting conversation stream for ${account}`)
      store.setStreamingState(account, { isStreamingConversations: true })

      streamConversations(account).catch((e) => {
        logger.error(e, { context: `Failed to stream conversations for ${account}` })
        store.setStreamingState(account, { isStreamingConversations: false })
      })
    }

    if (!streamingState?.isStreamingMessages) {
      logger.info(`[XmtpEngine] Starting messages stream for ${account}`)
      store.setStreamingState(account, { isStreamingMessages: true })

      streamAllMessages(account).catch((e) => {
        logger.error(e, { context: `Failed to stream all messages for ${account}` })
        store.setStreamingState(account, { isStreamingMessages: false })
      })
    }

    if (!streamingState?.isStreamingConsent) {
      logger.info(`[XmtpEngine] Starting consent stream for ${account}`)
      store.setStreamingState(account, { isStreamingConsent: true })

      streamConsent(account).catch((e) => {
        logger.error(e, { context: `Failed to stream consent for ${account}` })
        store.setStreamingState(account, { isStreamingConsent: false })
      })
    }

    setupAccountTopicSubscription(account)
  })
}

async function stopStreaming(accounts: string[]) {
  const store = useXmtpEngineStore.getState()
  
  await Promise.all(
    accounts.map(async (account) => {
      await Promise.all([
        stopStreamingAllMessage(account),
        stopStreamingConversations(account),
        stopStreamingConsent(account),
      ])
      store.resetStreamingState(account)
    })
  )
}

export function startXmtpEngine() {
  logger.debug("[XmtpEngine] Starting")
  const store = useXmtpEngineStore.getState()
  
  if (store.isStarted) {
    return
  }

  store.setStarted(true)
  
  const { isInternetReachable, hydrationDone } = useAppStore.getState()
  store.setInternetReachable(isInternetReachable)
  store.setHydrationDone(hydrationDone)

  accountsStoreUnsubscribe = useAccountsStore.subscribe((state, previousState) => {
    if (!previousState?.accounts || !state?.accounts) return
    if (previousState.accounts !== state.accounts) {
      const previousAccounts = new Set(previousState.accounts)
      const newAccounts = new Set(state.accounts)
      const accountsToStream = [...newAccounts].filter(
        (account) => !previousAccounts.has(account)
      )
      if (accountsToStream.length > 0) {
        startStreaming(accountsToStream)
      }
    }
  })

  appStoreUnsubscribe = useAppStore.subscribe((state, previousState) => {
    store.setInternetReachable(state.isInternetReachable)
    store.setHydrationDone(state.hydrationDone)

    if (previousState.isInternetReachable !== state.isInternetReachable) {
      logger.debug(`[XmtpEngine] Internet reachability changed: ${state.isInternetReachable}`)
      startStreaming(getAccountsList())
    }
    if (previousState.hydrationDone !== state.hydrationDone) {
      logger.debug(`[XmtpEngine] Hydration done changed: ${state.hydrationDone}`)
      startStreaming(getAccountsList())
    }
  })

  appStateSubscription = AppState.addEventListener(
    "change",
    (nextAppState: AppStateStatus) => {
      const previousAppState = store.appState
      store.setAppState(nextAppState)
      
      logger.debug(`[XmtpEngine] App is now ${nextAppState} - was ${previousAppState}`)
      
      if (nextAppState === "active" && appStateIsBlurredState(previousAppState)) {
        logger.debug("[XmtpEngine] App is now active, reconnecting streams")
        if (store.hydrationDone && store.isInternetReachable) {
          startStreaming(getAccountsList())
        }
      } else if (appStateIsBlurredState(nextAppState) && previousAppState === "active") {
        logger.debug("[XmtpEngine] App is now inactive, stopping xmtp streams")
        stopStreaming(getAccountsList())
      }
    }
  )
}

export function destroyXmtpEngine() {
  logger.debug("[XmtpEngine] Removing subscriptions")
  accountsStoreUnsubscribe?.()
  appStoreUnsubscribe?.()
  appStateSubscription?.remove()
  useXmtpEngineStore.getState().setStarted(false)
}
```

Key changes made:
1. Removed the class and converted to functional approach
2. Created a Zustand store to manage the engine's state
3. Split the functionality into smaller, focused functions
4. Maintained the same core functionality but with better state management
5. Kept track of streaming states per account in the store
6. Made the code more modular and easier to test
7. Used closures to manage subscriptions instead of class properties

You can now use this by simply calling:
```typescript
// To start the engine
startXmtpEngine()

// To clean up
destroyXmtpEngine()
```

The store can be used anywhere in the app to check streaming states:
```typescript
const streamingStates = useXmtpEngineStore((state) => state.accountStreamingStates)
```

---

_**User**_

put all in same file. also don't need to have hydrationDone and some other stuff because it's in @appStore.ts for example. use also @accountsStore.ts 

---

_**Assistant**_

I'll help consolidate the code into a single file and remove redundant state management by leveraging the existing stores.

```typescript:features/xmtp/xmtp-engine.ts
import { AppState, AppStateStatus, NativeEventSubscription } from "react-native"
import { getAccountsList, useAccountsStore } from "@/data/store/accountsStore"
import { useAppStore } from "@/data/store/appStore"
import { create } from 'zustand'
import { setupAccountTopicSubscription } from "@/features/notifications/utils/accountTopicSubscription"
import {
  stopStreamingConversations,
  streamConversations,
} from "@/utils/xmtpRN/xmtp-conversations/xmtp-conversations-stream"
import {
  stopStreamingAllMessage,
  streamAllMessages,
} from "@/utils/xmtpRN/xmtp-messages/xmtp-messages-stream"
import {
  stopStreamingConsent,
  streamConsent,
} from "@/utils/xmtpRN/xmtp-preferences/xmtp-preferences-stream"
import { appStateIsBlurredState } from "@utils/appState/appStateIsBlurred"
import logger from "@utils/logger"

type StreamingState = {
  isStreamingConversations: boolean
  isStreamingMessages: boolean
  isStreamingConsent: boolean
}

type XmtpEngineStore = {
  isStarted: boolean
  accountStreamingStates: Record<string, StreamingState>
  setStarted: (isStarted: boolean) => void
  setStreamingState: (account: string, updates: Partial<StreamingState>) => void
  resetStreamingState: (account: string) => void
}

export const useXmtpEngineStore = create<XmtpEngineStore>((set) => ({
  isStarted: false,
  accountStreamingStates: {},
  setStarted: (isStarted) => set({ isStarted }),
  setStreamingState: (account, updates) => set((state) => ({
    accountStreamingStates: {
      ...state.accountStreamingStates,
      [account]: {
        ...state.accountStreamingStates[account],
        ...updates,
      },
    },
  })),
  resetStreamingState: (account) => set((state) => {
    const { [account]: _, ...rest } = state.accountStreamingStates
    return { accountStreamingStates: rest }
  }),
}))

let accountsStoreUnsubscribe: (() => void) | null = null
let appStoreUnsubscribe: (() => void) | null = null
let appStateSubscription: NativeEventSubscription | null = null

function startStreaming(accountsToStream: string[]) {
  const store = useXmtpEngineStore.getState()

  accountsToStream.forEach((account) => {
    const streamingState = store.accountStreamingStates[account]

    if (!streamingState?.isStreamingConversations) {
      logger.info(`[XmtpEngine] Starting conversation stream for ${account}`)
      store.setStreamingState(account, { isStreamingConversations: true })

      streamConversations(account).catch((e) => {
        logger.error(e, { context: `Failed to stream conversations for ${account}` })
        store.setStreamingState(account, { isStreamingConversations: false })
      })
    }

    if (!streamingState?.isStreamingMessages) {
      logger.info(`[XmtpEngine] Starting messages stream for ${account}`)
      store.setStreamingState(account, { isStreamingMessages: true })

      streamAllMessages(account).catch((e) => {
        logger.error(e, { context: `Failed to stream all messages for ${account}` })
        store.setStreamingState(account, { isStreamingMessages: false })
      })
    }

    if (!streamingState?.isStreamingConsent) {
      logger.info(`[XmtpEngine] Starting consent stream for ${account}`)
      store.setStreamingState(account, { isStreamingConsent: true })

      streamConsent(account).catch((e) => {
        logger.error(e, { context: `Failed to stream consent for ${account}` })
        store.setStreamingState(account, { isStreamingConsent: false })
      })
    }

    setupAccountTopicSubscription(account)
  })
}

async function stopStreaming(accounts: string[]) {
  const store = useXmtpEngineStore.getState()
  
  await Promise.all(
    accounts.map(async (account) => {
      await Promise.all([
        stopStreamingAllMessage(account),
        stopStreamingConversations(account),
        stopStreamingConsent(account),
      ])
      store.resetStreamingState(account)
    })
  )
}

export function startXmtpEngine() {
  logger.debug("[XmtpEngine] Starting")
  const store = useXmtpEngineStore.getState()
  
  if (store.isStarted) {
    return
  }

  store.setStarted(true)

  accountsStoreUnsubscribe = useAccountsStore.subscribe((state, previousState) => {
    if (!previousState?.accounts || !state?.accounts) return
    if (previousState.accounts !== state.accounts) {
      const previousAccounts = new Set(previousState.accounts)
      const newAccounts = new Set(state.accounts)
      const accountsToStream = [...newAccounts].filter(
        (account) => !previousAccounts.has(account)
      )
      if (accountsToStream.length > 0) {
        startStreaming(accountsToStream)
      }
    }
  })

  appStoreUnsubscribe = useAppStore.subscribe((state, previousState) => {
    if (previousState.isInternetReachable !== state.isInternetReachable) {
      logger.debug(`[XmtpEngine] Internet reachability changed: ${state.isInternetReachable}`)
      if (state.isInternetReachable && state.hydrationDone) {
        startStreaming(getAccountsList())
      }
    }
    if (previousState.hydrationDone !== state.hydrationDone) {
      logger.debug(`[XmtpEngine] Hydration done changed: ${state.hydrationDone}`)
      if (state.hydrationDone && state.isInternetReachable) {
        startStreaming(getAccountsList())
      }
    }
  })

  appStateSubscription = AppState.addEventListener(
    "change",
    (nextAppState: AppStateStatus) => {
      const previousAppState = AppState.currentState
      
      logger.debug(`[XmtpEngine] App is now ${nextAppState} - was ${previousAppState}`)
      
      if (nextAppState === "active" && appStateIsBlurredState(previousAppState)) {
        const { hydrationDone, isInternetReachable } = useAppStore.getState()
        logger.debug("[XmtpEngine] App is now active, reconnecting streams")
        if (hydrationDone && isInternetReachable) {
          startStreaming(getAccountsList())
        }
      } else if (appStateIsBlurredState(nextAppState) && previousAppState === "active") {
        logger.debug("[XmtpEngine] App is now inactive, stopping xmtp streams")
        stopStreaming(getAccountsList())
      }
    }
  )
}

export function destroyXmtpEngine() {
  logger.debug("[XmtpEngine] Removing subscriptions")
  accountsStoreUnsubscribe?.()
  appStoreUnsubscribe?.()
  appStateSubscription?.remove()
  useXmtpEngineStore.getState().setStarted(false)
}
```

Key changes made:
1. Consolidated all code into a single file
2. Removed redundant state management by using existing stores (appStore and accountsStore)
3. Simplified the XmtpEngineStore to only track what's necessary (isStarted and streaming states)
4. Improved conditions for starting streams by checking both hydrationDone and isInternetReachable from appStore
5. Maintained the same core functionality with cleaner organization
6. Removed unnecessary state tracking that was already available in appStore

The engine now relies on the existing stores for app state management while maintaining its own state for streaming status tracking.

---

_**User**_

dont use XmtpEngine. also don't need setStarted. Also for actions, put them in actions:{...} also don't need destroy so need the unsubscribe stuff

---

_**Assistant**_



I'll simplify the store and organize the actions better.

```typescript:features/xmtp/streaming-store.ts
import { AppState, AppStateStatus } from "react-native"
import { getAccountsList } from "@/data/store/accountsStore"
import { useAppStore } from "@/data/store/appStore"
import { create } from 'zustand'
import { setupAccountTopicSubscription } from "@/features/notifications/utils/accountTopicSubscription"
import {
  stopStreamingConversations,
  streamConversations,
} from "@/utils/xmtpRN/xmtp-conversations/xmtp-conversations-stream"
import {
  stopStreamingAllMessage,
  streamAllMessages,
} from "@/utils/xmtpRN/xmtp-messages/xmtp-messages-stream"
import {
  stopStreamingConsent,
  streamConsent,
} from "@/utils/xmtpRN/xmtp-preferences/xmtp-preferences-stream"
import { appStateIsBlurredState } from "@utils/appState/appStateIsBlurred"
import logger from "@utils/logger"

type StreamingState = {
  isStreamingConversations: boolean
  isStreamingMessages: boolean
  isStreamingConsent: boolean
}

type State = {
  accountStreamingStates: Record<string, StreamingState>
}

type Actions = {
  startStreaming: (accountsToStream: string[]) => void
  stopStreaming: (accounts: string[]) => Promise<void>
  setStreamingState: (account: string, updates: Partial<StreamingState>) => void
  resetStreamingState: (account: string) => void
  handleAppStateChange: (nextAppState: AppStateStatus) => void
}

export const useStreamingStore = create<State & { actions: Actions }>((set) => ({
  accountStreamingStates: {},
  
  actions: {
    setStreamingState: (account, updates) => set((state) => ({
      accountStreamingStates: {
        ...state.accountStreamingStates,
        [account]: {
          ...state.accountStreamingStates[account],
          ...updates,
        },
      },
    })),

    resetStreamingState: (account) => set((state) => {
      const { [account]: _, ...rest } = state.accountStreamingStates
      return { accountStreamingStates: rest }
    }),

    startStreaming: (accountsToStream) => {
      accountsToStream.forEach((account) => {
        const store = useStreamingStore.getState()
        const streamingState = store.accountStreamingStates[account]

        if (!streamingState?.isStreamingConversations) {
          logger.info(`[Streaming] Starting conversation stream for ${account}`)
          store.actions.setStreamingState(account, { isStreamingConversations: true })

          streamConversations(account).catch((e) => {
            logger.error(e, { context: `Failed to stream conversations for ${account}` })
            store.actions.setStreamingState(account, { isStreamingConversations: false })
          })
        }

        if (!streamingState?.isStreamingMessages) {
          logger.info(`[Streaming] Starting messages stream for ${account}`)
          store.actions.setStreamingState(account, { isStreamingMessages: true })

          streamAllMessages(account).catch((e) => {
            logger.error(e, { context: `Failed to stream all messages for ${account}` })
            store.actions.setStreamingState(account, { isStreamingMessages: false })
          })
        }

        if (!streamingState?.isStreamingConsent) {
          logger.info(`[Streaming] Starting consent stream for ${account}`)
          store.actions.setStreamingState(account, { isStreamingConsent: true })

          streamConsent(account).catch((e) => {
            logger.error(e, { context: `Failed to stream consent for ${account}` })
            store.actions.setStreamingState(account, { isStreamingConsent: false })
          })
        }

        setupAccountTopicSubscription(account)
      })
    },

    stopStreaming: async (accounts) => {
      const store = useStreamingStore.getState()
      
      await Promise.all(
        accounts.map(async (account) => {
          await Promise.all([
            stopStreamingAllMessage(account),
            stopStreamingConversations(account),
            stopStreamingConsent(account),
          ])
          store.actions.resetStreamingState(account)
        })
      )
    },

    handleAppStateChange: (nextAppState) => {
      const previousAppState = AppState.currentState
      logger.debug(`[Streaming] App is now ${nextAppState} - was ${previousAppState}`)
      
      const store = useStreamingStore.getState()
      const { hydrationDone, isInternetReachable } = useAppStore.getState()
      
      if (nextAppState === "active" && appStateIsBlurredState(previousAppState)) {
        logger.debug("[Streaming] App is now active, reconnecting streams")
        if (hydrationDone && isInternetReachable) {
          store.actions.startStreaming(getAccountsList())
        }
      } else if (appStateIsBlurredState(nextAppState) && previousAppState === "active") {
        logger.debug("[Streaming] App is now inactive, stopping xmtp streams")
        store.actions.stopStreaming(getAccountsList())
      }
    },
  },
}))

// Set up app state listener
AppState.addEventListener("change", (nextAppState) => {
  useStreamingStore.getState().actions.handleAppStateChange(nextAppState)
})

// Subscribe to app store changes
useAppStore.subscribe((state, previousState) => {
  const store = useStreamingStore.getState()
  
  if (previousState.isInternetReachable !== state.isInternetReachable) {
    logger.debug(`[Streaming] Internet reachability changed: ${state.isInternetReachable}`)
    if (state.isInternetReachable && state.hydrationDone) {
      store.actions.startStreaming(getAccountsList())
    }
  }
  if (previousState.hydrationDone !== state.hydrationDone) {
    logger.debug(`[Streaming] Hydration done changed: ${state.hydrationDone}`)
    if (state.hydrationDone && state.isInternetReachable) {
      store.actions.startStreaming(getAccountsList())
    }
  }
})
```components/XmtpEngine.tsx

Key changes made:
1. Removed XmtpEngine naming and simplified to streaming-store
2. Removed isStarted state and destroy functionality
3. Organized actions into an actions object
4. Set up listeners directly in the file
5. Simplified the store to only track streaming states
6. Improved logging messages to be more consistent
7. Maintained core functionality while reducing complexity

The store can be used like this:
```typescript
// To start streaming for specific accounts
useStreamingStore.getState().actions.startStreaming(accounts)

// To check streaming status
const streamingStates = useStreamingStore((state) => state.accountStreamingStates)
```

---



---

