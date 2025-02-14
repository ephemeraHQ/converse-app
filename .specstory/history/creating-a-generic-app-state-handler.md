## SpecStory

## Creating a Generic App State Handler (1/28/2025, 1:54:24 PM)

_**User**_

can we create a generic appstatehandler listner that isn't in a react hook?

---

_**Assistant**_

Yes, we can create a generic app state handler utility that manages app state subscriptions without being tied to React hooks. Here's how we can implement it:

```typescript:utils/app-state-handler.ts
import { AppState, AppStateStatus } from "react-native";
import logger from "@utils/logger";

type AppStateHandler = (
  nextAppState: AppStateStatus,
  previousAppState: AppStateStatus
) => void;

class AppStateManager {
  private handlers: Set<AppStateHandler> = new Set();
  private currentAppState: AppStateStatus = AppState.currentState;
  private listener: ReturnType<typeof AppState.addEventListener> | null = null;

  constructor() {
    this.setupListener();
  }

  private setupListener() {
    // Clean up existing listener if any
    if (this.listener) {
      this.listener.remove();
    }

    this.listener = AppState.addEventListener("change", (nextAppState) => {
      const previousAppState = this.currentAppState;
      logger.debug(`App state changing from ${previousAppState} to ${nextAppState}`);

      // Notify all handlers
      this.handlers.forEach((handler) => {
        try {
          handler(nextAppState, previousAppState);
        } catch (error) {
          logger.error(`Error in app state handler: ${error}`);
        }
      });

      this.currentAppState = nextAppState;
    });
  }

  public addHandler(handler: AppStateHandler): () => void {
    this.handlers.add(handler);

    // Return cleanup function
    return () => {
      this.handlers.delete(handler);
    };
  }

  public removeHandler(handler: AppStateHandler) {
    this.handlers.delete(handler);
  }

  public getCurrentState(): AppStateStatus {
    return this.currentAppState;
  }

  public cleanup() {
    if (this.listener) {
      this.listener.remove();
      this.listener = null;
    }
    this.handlers.clear();
  }
}

// Create singleton instance
export const appStateManager = new AppStateManager();
```

Then we can update the XmtpEngine to use this manager instead of direct AppState subscription:

```typescript:components/XmtpEngine.tsx
// ... existing imports ...
import { appStateManager } from "@utils/app-state-handler";

// ... existing code ...

// Replace the AppState.addEventListener with:
appStateManager.addHandler((nextAppState, previousAppState) => {
  useStreamingStore.getState().actions.handleAppStateChange(nextAppState);
});

// ... rest of the existing code ...
```

This approach offers several benefits:

1. Centralized app state management
2. Better error handling
3. Easier cleanup
4. Ability to add/remove handlers dynamically
5. Type safety
6. Prevents memory leaks through proper cleanup

You can use this manager anywhere in your app like this:

```typescript
// Example usage in any file:
const cleanup = appStateManager.addHandler((nextState, prevState) => {
  if (nextState === 'active' && prevState !== 'active') {
    // Handle foreground
  } else if (prevState === 'active' && nextState !== 'active') {
    // Handle background
  }
});

// When you need to cleanup:
cleanup();
```

The `useAppStateHandlers` hook can also be updated to use this manager instead of direct AppState subscription if you want to keep using it in React components:

```typescript:hooks/useAppStateHandlers.ts
import { useEffect } from "react";
import { AppStateStatus } from "react-native";
import { appStateManager } from "@utils/app-state-handler";

export type AppStateHookSettings = {
  onChange?: (status: AppStateStatus, previousStatus: AppStateStatus) => void;
  onForeground?: () => void;
  onBackground?: () => void;
  onInactive?: () => void;
  deps?: React.DependencyList;
};

export function useAppStateHandlers(settings?: AppStateHookSettings) {
  const {
    onChange,
    onForeground,
    onBackground,
    onInactive,
    deps = [],
  } = settings || {};

  useEffect(() => {
    const handler = (nextAppState: AppStateStatus, previousAppState: AppStateStatus) => {
      if (nextAppState === "active" && previousAppState !== "active") {
        onForeground?.();
      } else if (previousAppState === "active" && nextAppState === "background") {
        onBackground?.();
      } else if (previousAppState === "active" && nextAppState === "inactive") {
        onInactive?.();
      }

      onChange?.(nextAppState, previousAppState);
    };

    return appStateManager.addHandler(handler);
  }, [onChange, onForeground, onBackground, onInactive, ...deps]);
}
```

---

_**User**_

wihtout using a class

---

_**Assistant**_

Here's a functional approach to create the app state handler utility:

```typescript:utils/app-state-handler.ts
import { AppState, AppStateStatus } from "react-native";
import logger from "@utils/logger";

type AppStateHandler = (
  nextAppState: AppStateStatus,
  previousAppState: AppStateStatus
) => void;

type AppStateStore = {
  handlers: Set<AppStateHandler>;
  currentAppState: AppStateStatus;
  listener: ReturnType<typeof AppState.addEventListener> | null;
};

const store: AppStateStore = {
  handlers: new Set(),
  currentAppState: AppState.currentState,
  listener: null,
};

function setupListener() {
  // Clean up existing listener if any
  if (store.listener) {
    store.listener.remove();
  }

  store.listener = AppState.addEventListener("change", (nextAppState) => {
    const previousAppState = store.currentAppState;
    logger.debug(`App state changing from ${previousAppState} to ${nextAppState}`);

    // Notify all handlers
    store.handlers.forEach((handler) => {
      try {
        handler(nextAppState, previousAppState);
      } catch (error) {
        logger.error(`Error in app state handler: ${error}`);
      }
    });

    store.currentAppState = nextAppState;
  });
}

export function addAppStateHandler(handler: AppStateHandler): () => void {
  if (!store.listener) {
    setupListener();
  }
  
  store.handlers.add(handler);

  // Return cleanup function
  return () => {
    store.handlers.delete(handler);
    
    // If no handlers left, remove the listener
    if (store.handlers.size === 0 && store.listener) {
      store.listener.remove();
      store.listener = null;
    }
  };
}

export function removeAppStateHandler(handler: AppStateHandler) {
  store.handlers.delete(handler);
  
  // If no handlers left, remove the listener
  if (store.handlers.size === 0 && store.listener) {
    store.listener.remove();
    store.listener = null;
  }
}

export function getCurrentAppState(): AppStateStatus {
  return store.currentAppState;
}

export function cleanup() {
  if (store.listener) {
    store.listener.remove();
    store.listener = null;
  }
  store.handlers.clear();
}
```

Then update the XmtpEngine to use these functions:

```typescript:components/XmtpEngine.tsx
// ... existing imports ...
import { addAppStateHandler } from "@utils/app-state-handler";

// ... existing code ...

// Replace the AppState.addEventListener with:
addAppStateHandler((nextAppState, previousAppState) => {
  useStreamingStore.getState().actions.handleAppStateChange(nextAppState);
});

// ... rest of the existing code ...
```

And update the useAppStateHandlers hook if needed:

```typescript:hooks/useAppStateHandlers.ts
import { useEffect } from "react";
import { AppStateStatus } from "react-native";
import { addAppStateHandler } from "@utils/app-state-handler";

export type AppStateHookSettings = {
  onChange?: (status: AppStateStatus, previousStatus: AppStateStatus) => void;
  onForeground?: () => void;
  onBackground?: () => void;
  onInactive?: () => void;
  deps?: React.DependencyList;
};

export function useAppStateHandlers(settings?: AppStateHookSettings) {
  const {
    onChange,
    onForeground,
    onBackground,
    onInactive,
    deps = [],
  } = settings || {};

  useEffect(() => {
    const handler = (nextAppState: AppStateStatus, previousAppState: AppStateStatus) => {
      if (nextAppState === "active" && previousAppState !== "active") {
        onForeground?.();
      } else if (previousAppState === "active" && nextAppState === "background") {
        onBackground?.();
      } else if (previousAppState === "active" && nextAppState === "inactive") {
        onInactive?.();
      }

      onChange?.(nextAppState, previousAppState);
    };

    return addAppStateHandler(handler);
  }, [onChange, onForeground, onBackground, onInactive, ...deps]);
}
```

This functional approach:
1. Uses a simple store object instead of class instance
2. Exports individual functions instead of methods
3. Automatically manages the listener lifecycle based on handler count
4. Maintains the same functionality as the class-based version
5. Is more aligned with functional programming principles

You can use it anywhere in your app like this:

```typescript
// Example usage:
const cleanup = addAppStateHandler((nextState, prevState) => {
  if (nextState === 'active' && prevState !== 'active') {
    // Handle foreground
  } else if (prevState === 'active' && nextState !== 'active') {
    // Handle background
  }
});

// When you need to cleanup:
cleanup();
```

---

_**User**_

i think it want something easier. Like with Zustand we can prob have a use-app-state that will update the appState of the app and then other places we can subscribe to this store to get app state update and have our own typing for state like "active" "background" and others

---

_**Assistant**_



Ah yes, that's a much simpler approach! Here's how we can implement it using Zustand:

```typescript:utils/stores/use-app-state.ts
import { create } from "zustand";
import { AppState, AppStateStatus } from "react-native";
import logger from "@utils/logger";

type AppStateStore = {
  currentState: AppStateStatus;
  previousState: AppStateStatus | null;
  isActive: boolean;
  isBackground: boolean;
  isInactive: boolean;
  actions: {
    handleAppStateChange: (nextAppState: AppStateStatus) => void;
  };
};

export const useAppState = create<AppStateStore>((set) => ({
  currentState: AppState.currentState,
  previousState: null,
  isActive: AppState.currentState === "active",
  isBackground: AppState.currentState === "background",
  isInactive: AppState.currentState === "inactive",

  actions: {
    handleAppStateChange: (nextAppState) =>
      set((state) => {
        logger.debug(
          `App state changing from ${state.currentState} to ${nextAppState}`
        );

        return {
          previousState: state.currentState,
          currentState: nextAppState,
          isActive: nextAppState === "active",
          isBackground: nextAppState === "background",
          isInactive: nextAppState === "inactive",
        };
      }),
  },
}));

// Set up app state listener
AppState.addEventListener("change", (nextAppState) => {
  useAppState.getState().actions.handleAppStateChange(nextAppState);
});
```

Then we can update the XmtpEngine to use this store:

```typescript:components/XmtpEngine.tsx
// ... existing imports ...
import { useAppState } from "@utils/stores/use-app-state";

// Remove the direct AppState listener and instead subscribe to our store
useAppState.subscribe((state, previousState) => {
  if (state.isActive && !previousState.isActive) {
    logger.debug("[Streaming] App is now active, reconnecting streams");
    const { hydrationDone, isInternetReachable } = useAppStore.getState();
    if (hydrationDone && isInternetReachable) {
      useStreamingStore.getState().actions.startStreaming(getAccountsList());
    }
  } else if (!state.isActive && previousState.isActive) {
    logger.debug("[Streaming] App is now inactive, stopping xmtp streams");
    useStreamingStore.getState().actions.stopStreaming(getAccountsList());
  }
});

// ... rest of the existing code ...
```

And the useAppStateHandlers hook becomes much simpler:

```typescript:hooks/useAppStateHandlers.ts
import { useEffect } from "react";
import { AppStateStatus } from "react-native";
import { useAppState } from "@utils/stores/use-app-state";

export type AppStateHookSettings = {
  onChange?: (status: AppStateStatus, previousStatus: AppStateStatus | null) => void;
  onForeground?: () => void;
  onBackground?: () => void;
  onInactive?: () => void;
  deps?: React.DependencyList;
};

export function useAppStateHandlers(settings?: AppStateHookSettings) {
  const {
    onChange,
    onForeground,
    onBackground,
    onInactive,
    deps = [],
  } = settings || {};

  useEffect(() => {
    return useAppState.subscribe((state) => {
      const { currentState, previousState } = state;

      if (currentState === "active" && previousState !== "active") {
        onForeground?.();
      } else if (previousState === "active" && currentState === "background") {
        onBackground?.();
      } else if (previousState === "active" && currentState === "inactive") {
        onInactive?.();
      }

      onChange?.(currentState, previousState);
    });
  }, [onChange, onForeground, onBackground, onInactive, ...deps]);
}
```

Usage examples:

```typescript
// Using the hook
useAppStateHandlers({
  onForeground: () => console.log("App came to foreground"),
  onBackground: () => console.log("App went to background"),
});

// Direct store usage
const isActive = useAppState((state) => state.isActive);

// Subscribe anywhere in your app
useAppState.subscribe((state) => {
  if (state.isActive) {
    // Handle active state
  }
});

// Get current state without subscribing
const currentState = useAppState.getState().currentState;
```

This approach is:
1. Much simpler to implement and maintain
2. Provides type-safe access to app state
3. Includes helpful derived states (isActive, isBackground, isInactive)
4. Uses Zustand's built-in subscription mechanism
5. Consistent with your existing store patterns

---

_**User**_

maybe not have isActive, etc... just have currentState and previousState

---

_**Assistant**_



Yes, that's even simpler! Here's the streamlined version:

```typescript:utils/stores/use-app-state.ts
import { create } from "zustand";
import { AppState, AppStateStatus } from "react-native";
import logger from "@utils/logger";

type State = {
  currentState: AppStateStatus;
  previousState: AppStateStatus | null;
};

type Actions = {
  handleAppStateChange: (nextAppState: AppStateStatus) => void;
};

export const useAppState = create<State & { actions: Actions }>((set) => ({
  currentState: AppState.currentState,
  previousState: null,

  actions: {
    handleAppStateChange: (nextAppState) =>
      set((state) => {
        logger.debug(
          `App state changing from ${state.currentState} to ${nextAppState}`
        );
        return {
          previousState: state.currentState,
          currentState: nextAppState,
        };
      }),
  },
}));

// Set up app state listener
AppState.addEventListener("change", (nextAppState) => {
  useAppState.getState().actions.handleAppStateChange(nextAppState);
});
```

Then in XmtpEngine:

```typescript:components/XmtpEngine.tsx
// ... existing imports ...
import { useAppState } from "@utils/stores/use-app-state";

useAppState.subscribe((state) => {
  const isGoingActive = state.currentState === "active" && 
    state.previousState !== "active";
  const isLeavingActive = state.previousState === "active" && 
    state.currentState !== "active";

  if (isGoingActive) {
    logger.debug("[Streaming] App is now active, reconnecting streams");
    const { hydrationDone, isInternetReachable } = useAppStore.getState();
    if (hydrationDone && isInternetReachable) {
      useStreamingStore.getState().actions.startStreaming(getAccountsList());
    }
  } else if (isLeavingActive) {
    logger.debug("[Streaming] App is now inactive, stopping xmtp streams");
    useStreamingStore.getState().actions.stopStreaming(getAccountsList());
  }
});

// ... rest of the existing code ...
```

And the hook becomes:

```typescript:hooks/useAppStateHandlers.ts
import { useEffect } from "react";
import { AppStateStatus } from "react-native";
import { useAppState } from "@utils/stores/use-app-state";

export type AppStateHookSettings = {
  onChange?: (status: AppStateStatus, previousStatus: AppStateStatus | null) => void;
  onForeground?: () => void;
  onBackground?: () => void;
  onInactive?: () => void;
  deps?: React.DependencyList;
};

export function useAppStateHandlers(settings?: AppStateHookSettings) {
  const {
    onChange,
    onForeground,
    onBackground,
    onInactive,
    deps = [],
  } = settings || {};

  useEffect(() => {
    return useAppState.subscribe((state) => {
      const { currentState, previousState } = state;

      if (currentState === "active" && previousState !== "active") {
        onForeground?.();
      } else if (previousState === "active" && currentState === "background") {
        onBackground?.();
      } else if (previousState === "active" && currentState === "inactive") {
        onInactive?.();
      }

      onChange?.(currentState, previousState);
    });
  }, [onChange, onForeground, onBackground, onInactive, ...deps]);
}
```

Usage examples:

```typescript
// Using the hook
useAppStateHandlers({
  onForeground: () => console.log("App came to foreground"),
  onBackground: () => console.log("App went to background"),
});

// Direct store usage
const { currentState, previousState } = useAppState();

// Subscribe anywhere
useAppState.subscribe((state) => {
  const isActive = state.currentState === "active";
  if (isActive) {
    // Handle active state
  }
});

// Get current state without subscribing
const { currentState } = useAppState.getState();
```

This is much cleaner and gives consumers the flexibility to derive their own state checks as needed!

---



---

