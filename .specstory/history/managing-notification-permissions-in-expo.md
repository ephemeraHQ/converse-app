## SpecStory

## Managing Notification Permissions in Expo (2/13/2025, 1:13:54 PM)

_**User**_

does expo-notificaitons have a way to listen to the notifications permissions on the user device? @https://docs.expo.dev/versions/latest/sdk/notifications/ 

---

_**Assistant**_

Based on the Expo Notifications documentation, there isn't a direct listener for notification permission changes. However, you can use `getPermissionsAsync()` to check the current permission status.

Here's how I would implement a permissions store to handle notification permissions:

```typescript:data/store/permissions-store.ts
import * as Notifications from "expo-notifications";
import { create } from "zustand";
import { logger } from "@/utils/logger";

type IPermissionsStore = {
  notificationsPermission: Notifications.NotificationPermissionsStatus | null;
  checkNotificationsPermission: () => Promise<void>;
  requestNotificationsPermission: () => Promise<void>;
};

export const usePermissionsStore = create<IPermissionsStore>((set) => ({
  notificationsPermission: null,

  checkNotificationsPermission: async () => {
    try {
      const status = await Notifications.getPermissionsAsync();
      set({ notificationsPermission: status });
    } catch (error) {
      logger.error(`Failed to check notifications permission: ${error}`);
    }
  },

  requestNotificationsPermission: async () => {
    try {
      const status = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
        },
      });
      set({ notificationsPermission: status });
    } catch (error) {
      logger.error(`Failed to request notifications permission: ${error}`);
    }
  },
}));
```

You can then use this store in your components to:

1. Check current permission status
2. Request permissions
3. React to permission changes by checking the stored status

For example:

```typescript
const { notificationsPermission, checkNotificationsPermission } = usePermissionsStore();

// Check permissions on mount
useEffect(() => {
  checkNotificationsPermission();
}, []);

// Access current permission status
const isGranted = notificationsPermission?.granted;
```

While there isn't a direct listener for permission changes, you can:

1. Check permissions when your app comes to the foreground
2. Check permissions before performing notification-related operations
3. Check permissions after requesting them

This will help keep your app's knowledge of notification permissions up to date.

---



---

