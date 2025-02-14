## SpecStory

## Improving Expo Notifications Permissions Handling (2/13/2025, 2:18:06 PM)

_**User**_

check docs here anything missing? @https://docs.expo.dev/versions/latest/sdk/notifications/ 

---

_**Assistant**_

Based on the Expo Notifications documentation, there are a few improvements we could make to the notifications permissions handling:

1. We should properly handle iOS-specific permission status interpretation
2. We should add Android notification channel creation before requesting permissions
3. We could add more comprehensive permission status checking

Here's the suggested update:

```typescript:features/notifications/notifications-permissions.ts
import { queryClient } from "@/queries/queryClient";
import { queryOptions } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Query configuration
const getNotificationsPermissionsQueryConfig = () => {
  return queryOptions({
    queryKey: ["notifications-permissions"],
    queryFn: () => Notifications.getPermissionsAsync(),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: Infinity,
  });
};

// Get or fetch permissions
export function getOrFetchNotificationsPermissions() {
  return queryClient.ensureQueryData(getNotificationsPermissionsQueryConfig());
}

// Check if user has granted permissions, handling iOS specific cases
export async function userHasGrantedNotificationsPermissions() {
  const permission = await getOrFetchNotificationsPermissions();
  
  if (Platform.OS === 'ios') {
    return (
      permission.granted || 
      permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
      permission.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED
    );
  }
  
  return permission.status === Notifications.PermissionStatus.GRANTED;
}

// Check if we can ask for permissions
export async function canAskForNotificationsPermissions() {
  const permission = await getOrFetchNotificationsPermissions();
  return permission.canAskAgain;
}

// Request permissions with proper Android channel setup
export async function requestNotificationsPermissions() {
  if (Platform.OS === 'android') {
    // Create default notification channel
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowCriticalAlerts: true,
      allowProvisional: true, // Allow provisional authorization
      allowAnnouncements: true,
      allowDisplayInCarPlay: true,
      provideAppNotificationSettings: true,
    },
  });
}

// Helper to get a readable permission status
export async function getNotificationPermissionStatus() {
  const permission = await getOrFetchNotificationsPermissions();
  
  if (Platform.OS === 'ios') {
    switch (permission.ios?.status) {
      case Notifications.IosAuthorizationStatus.NOT_DETERMINED:
        return 'not_determined';
      case Notifications.IosAuthorizationStatus.DENIED:
        return 'denied';
      case Notifications.IosAuthorizationStatus.AUTHORIZED:
        return 'authorized';
      case Notifications.IosAuthorizationStatus.PROVISIONAL:
        return 'provisional';
      case Notifications.IosAuthorizationStatus.EPHEMERAL:
        return 'ephemeral';
      default:
        return 'unknown';
    }
  }

  return permission.status;
}
```

Key improvements made:

1. Added proper iOS permission status handling using `IosAuthorizationStatus`
2. Added Android notification channel creation before requesting permissions
3. Added more iOS permission options including:
   - `allowProvisional` for provisional notifications
   - `allowAnnouncements` for Siri announcements
   - `allowDisplayInCarPlay` for CarPlay support
   - `provideAppNotificationSettings` for in-app notification settings
4. Added a helper function to get readable permission status
5. Improved iOS permission checking to include PROVISIONAL and AUTHORIZED statuses

These changes make the permissions handling more robust and platform-aware, following the best practices from the Expo documentation.

Let me know if you would like me to explain any of these changes in more detail!

---

_**User**_

what is difference between provisitonl and authorize and granted?

---

_**Assistant**_

Let me explain the key differences between these notification permission states in iOS:

1. **Granted** (`permission.granted`):
- This is a general boolean flag that indicates if any form of notification permission has been given
- It will be true for both provisional and authorized permissions
- It's a simpler way to check if you can send notifications at all

2. **Authorized** (`IosAuthorizationStatus.AUTHORIZED`):
- This is the traditional "full" notification permission
- User has explicitly allowed notifications through the system prompt
- Allows all notification features (alerts, sounds, badges)
- Notifications appear in the notification center and lock screen
- User was shown the standard iOS permission dialog and clicked "Allow"

3. **Provisional** (`IosAuthorizationStatus.PROVISIONAL`):
- This is a "lightweight" permission introduced in iOS 12
- Allows delivering notifications quietly without first asking user permission
- Notifications only appear in the Notification Center, not on lock screen
- No sounds, alerts, or badges
- User can later upgrade to full authorization or disable notifications
- Enabled by setting `allowProvisional: true` in permission request
- Great for a less intrusive first-time user experience

Here's a practical example of how these states might be used:

```typescript
// Example usage showing different permission states
async function handleNotificationPermissionStates() {
  const permission = await getOrFetchNotificationsPermissions();
  
  if (permission.granted) {
    // Can send notifications in some form (either provisional or authorized)
  }
  
  if (permission.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED) {
    // Can send full-featured notifications with sounds, alerts, badges
  }
  
  if (permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    // Can only send quiet notifications to Notification Center
    // Might want to prompt user to upgrade to full permissions
  }
}
```

Best Practice:
- Consider starting with provisional permissions (less intrusive)
- Later, you can prompt users to upgrade to full authorization when they've experienced value from your notifications
- This two-step approach often leads to higher opt-in rates for full notification permissions

Would you like me to add any helper functions to handle these different states more explicitly in the code?

---

_**User**_

ok i don't think we'll use provisional notif in our app. it's all in or not

---

_**Assistant**_

Alright, let's simplify the permissions handling by removing the provisional notification logic since we want users to explicitly opt-in to notifications.

```typescript:features/notifications/notifications-permissions.ts
import { queryClient } from "@/queries/queryClient";
import { queryOptions } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const getNotificationsPermissionsQueryConfig = () => {
  return queryOptions({
    queryKey: ["notifications-permissions"],
    queryFn: () => Notifications.getPermissionsAsync(),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: Infinity,
  });
};

export function getOrFetchNotificationsPermissions() {
  return queryClient.ensureQueryData(getNotificationsPermissionsQueryConfig());
}

export async function userHasGrantedNotificationsPermissions() {
  const permission = await getOrFetchNotificationsPermissions();
  
  if (Platform.OS === "ios") {
    return permission.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED;
  }
  
  return permission.status === Notifications.PermissionStatus.GRANTED;
}

export async function canAskForNotificationsPermissions() {
  const permission = await getOrFetchNotificationsPermissions();
  return permission.canAskAgain;
}

export async function requestNotificationsPermissions() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowCriticalAlerts: true,
    },
  });
}

export async function getNotificationPermissionStatus() {
  const permission = await getOrFetchNotificationsPermissions();
  
  if (Platform.OS === "ios") {
    switch (permission.ios?.status) {
      case Notifications.IosAuthorizationStatus.NOT_DETERMINED:
        return "not_determined";
      case Notifications.IosAuthorizationStatus.DENIED:
        return "denied";
      case Notifications.IosAuthorizationStatus.AUTHORIZED:
        return "authorized";
      default:
        return "unknown";
    }
  }

  return permission.status;
}
```

Changes made:
1. Removed provisional notification logic and related options
2. Simplified iOS permission check to only look for fully authorized status
3. Removed optional notification features like CarPlay and announcements
4. Fixed string quotes to use double quotes consistently
5. Simplified the permission status types to only include the ones we'll actually use

The code now has a clearer "all or nothing" approach to notification permissions, which better matches your use case. Users will either fully authorize notifications or won't receive them at all.

---



---

