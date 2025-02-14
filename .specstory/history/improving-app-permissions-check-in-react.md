## SpecStory

## Improving App Permissions Check in React (2/13/2025, 1:23:53 PM)

_**User**_

is this a good way to do this to check app active? Or is there a better and cleaner wway?

---

_**Assistant**_

I'll suggest a better approach using React's lifecycle and hooks pattern. The current implementation has a few issues:

1. It creates a subscription every time the function is called without cleanup
2. It's using store subscriptions outside of React's lifecycle
3. The service pattern here doesn't follow React's patterns for handling side effects

Here's a better implementation:

```typescript:features/notifications/notifications-permissions.ts
import { usePermissionsStore } from "@/data/store/permissions-store";
import { useAppState } from "@/data/store/use-app-state-store";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";

const NotificationsPermissions = {
  undetermined: Notifications.PermissionStatus.UNDETERMINED,
  granted: Notifications.PermissionStatus.GRANTED,
  denied: Notifications.PermissionStatus.DENIED,
} as const;

type INotificationsPermissions = keyof typeof NotificationsPermissions;

import { create } from "zustand";

type INotificationsPermissionsStore = {
  permission: INotificationsPermissions;
};

const useNotificationsPermissionsStore = create<INotificationsPermissionsStore>(
  (set) => ({
    permission: NotificationsPermissions.undetermined,
  })
);

// Custom hook to handle permissions check when app becomes active
export function useNotificationsPermissionsCheck() {
  const currentState = useAppState((state) => state.currentState);
  const checkNotificationsPermission = usePermissionsStore(
    (state) => state.checkNotificationsPermission
  );

  useEffect(() => {
    if (currentState === "active") {
      checkNotificationsPermission();
    }
  }, [currentState, checkNotificationsPermission]);
}
```

Key improvements:

1. Converted the service into a custom hook that can be used in a component
2. Uses React's `useEffect` to properly handle the side effect
3. Uses selective store subscriptions with selectors to prevent unnecessary rerenders
4. Follows React's lifecycle patterns
5. Automatically cleans up when the component unmounts

You would use this hook in your app's root component or where notifications need to be handled:

```typescript
// In your App.tsx or similar root component
export function App() {
  useNotificationsPermissionsCheck();
  
  // ... rest of your app code
}
```

This approach is more React-idiomatic and will be easier to test and maintain. It also properly handles cleanup and prevents potential memory leaks from unmanaged subscriptions.

---



---

