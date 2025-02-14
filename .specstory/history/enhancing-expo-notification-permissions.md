## SpecStory

## Enhancing Expo Notification Permissions (2/13/2025, 2:10:40 PM)

_**User**_

what are some missing functions i could export here to help with notifications permissions. check @https://docs.expo.dev/versions/latest/sdk/notifications/ 

---

_**Assistant**_

Based on the Expo Notifications documentation, here are some useful additional functions we could add to the notifications permissions module:

```typescript:features/notifications/notifications-permissions.ts
// ... existing imports and code ...

/**
 * Checks if the app has provisional notification permissions on iOS
 */
export async function hasProvisionalPermissions() {
  const permissions = await ensureNotificationsPermissions();
  return permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

/**
 * Checks if notifications are allowed by checking both granted and provisional permissions
 */
export async function allowsNotifications() {
  const permissions = await ensureNotificationsPermissions();
  return (
    permissions.granted || 
    permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

/**
 * Request notification permissions with custom configuration
 */
export async function requestNotificationsPermissionsWithConfig(config?: {
  ios?: {
    allowAlert?: boolean;
    allowBadge?: boolean;
    allowSound?: boolean;
    allowAnnouncements?: boolean;
    allowCriticalAlerts?: boolean;
    provideAppNotificationSettings?: boolean;
    allowProvisional?: boolean;
    allowDisplayInCarPlay?: boolean;
  };
}) {
  return Notifications.requestPermissionsAsync(config);
}

/**
 * Gets the detailed permissions status including iOS-specific settings
 */
export async function getDetailedPermissionsStatus() {
  const permissions = await ensureNotificationsPermissions();
  return {
    status: permissions.status,
    granted: permissions.granted,
    ios: permissions.ios && {
      status: permissions.ios.status,
      allowsAlert: permissions.ios.allowsAlert,
      allowsBadge: permissions.ios.allowsBadge,
      allowsSound: permissions.ios.allowsSound,
      allowsAnnouncements: permissions.ios.allowsAnnouncements,
      allowsCriticalAlerts: permissions.ios.allowsCriticalAlerts,
      providesAppNotificationSettings: permissions.ios.providesAppNotificationSettings,
      allowsDisplayInCarPlay: permissions.ios.allowsDisplayInCarPlay,
    },
  };
}

/**
 * Checks if critical notifications are allowed (iOS only)
 */
export async function allowsCriticalNotifications() {
  const permissions = await ensureNotificationsPermissions();
  return permissions.ios?.allowsCriticalAlerts ?? false;
}

/**
 * Request permissions specifically for critical notifications (iOS only)
 */
export async function requestCriticalNotificationsPermissions() {
  return requestNotificationsPermissionsWithConfig({
    ios: {
      allowCriticalAlerts: true,
    },
  });
}

/**
 * Request provisional notifications permissions (iOS only)
 * This allows delivering quiet notifications without explicitly asking user permission
 */
export async function requestProvisionalPermissions() {
  return requestNotificationsPermissionsWithConfig({
    ios: {
      allowProvisional: true,
    },
  });
}

/**
 * Checks if the permission status is still undetermined
 */
export async function isPermissionStatusUndetermined() {
  const permissions = await ensureNotificationsPermissions();
  return permissions.status === Notifications.PermissionStatus.UNDETERMINED;
}
```

These new functions provide:

1. Better iOS-specific permission handling with provisional and critical notifications support
2. More detailed permission status checking
3. Configurable permission requests
4. Helper functions for checking specific permission types
5. Functions to handle undetermined permission states

The functions follow the existing pattern of using the queryClient for caching permissions data while providing more granular control over different types of notification permissions.

These additions would be particularly useful for:
- Apps that need different levels of notification permissions
- iOS-specific notification features
- More detailed permission status reporting
- Progressive permission requesting (starting with provisional and later requesting full permissions)
- Critical notifications for important alerts

Would you like me to explain any of these functions in more detail?

---



---

