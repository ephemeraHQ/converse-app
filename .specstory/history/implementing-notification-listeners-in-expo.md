## SpecStory

## Implementing Notification Listeners in Expo (2/13/2025, 2:28:14 PM)

_**User**_

implement notificaitons listenenrs . check what's availabel here @https://docs.expo.dev/versions/latest/sdk/notifications/ 

---

_**Assistant**_

I'll help you implement the notifications listeners based on the Expo Notifications documentation. I'll create a comprehensive notifications listener implementation that follows the provided code style guide.

```typescript:features/notifications/notifications-listeners.ts
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { logger } from "@/utils/logger";
import { router } from "expo-router";

type INotificationListener = {
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationResponseReceived?: (
    response: Notifications.NotificationResponse
  ) => void;
  onNotificationsDropped?: () => void;
};

/**
 * Hook to handle all notification listeners in one place
 */
export function useNotificationListeners({
  onNotificationReceived,
  onNotificationResponseReceived,
  onNotificationsDropped,
}: INotificationListener = {}) {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const droppedListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Listen for incoming notifications while app is foregrounded
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        logger.debug(
          `[useNotificationListeners] Notification received: ${notification.request.identifier}`
        );
        onNotificationReceived?.(notification);
      });

    // Listen for user interactions with notifications
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const url = response.notification.request.content.data?.url as
          | string
          | undefined;

        logger.debug(
          `[useNotificationListeners] Notification response received for ${response.notification.request.identifier}`
        );

        // Handle deep linking if URL is present
        if (url) {
          router.push(url);
        }

        onNotificationResponseReceived?.(response);
      });

    // Listen for notifications that were dropped
    droppedListener.current = Notifications.addNotificationsDroppedListener(() => {
      logger.debug("[useNotificationListeners] Notifications were dropped");
      onNotificationsDropped?.();
    });

    // Cleanup subscriptions on unmount
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }

      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }

      if (droppedListener.current) {
        Notifications.removeNotificationSubscription(droppedListener.current);
      }
    };
  }, [onNotificationReceived, onNotificationResponseReceived, onNotificationsDropped]);
}

/**
 * Hook to handle the last notification response
 */
export function useLastNotificationResponse() {
  useEffect(() => {
    // Check if app was opened from a notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const url = response.notification.request.content.data?.url as
          | string
          | undefined;

        logger.debug(
          `[useLastNotificationResponse] App opened from notification: ${response.notification.request.identifier}`
        );

        // Handle deep linking if URL is present
        if (url) {
          router.push(url);
        }
      }
    });
  }, []);
}

/**
 * Set up the notification handler for how notifications should be handled 
 * when the app is in the foreground
 */
export function setNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
    handleSuccess: (notificationId) => {
      logger.debug(
        `[setNotificationHandler] Successfully handled notification: ${notificationId}`
      );
    },
    handleError: (notificationId, error) => {
      logger.error(
        `[setNotificationHandler] Error handling notification ${notificationId}: ${error}`
      );
    },
  });
}
```

This implementation provides:

1. `useNotificationListeners` hook that sets up all notification listeners:
   - Listens for incoming notifications while app is foregrounded
   - Listens for user interactions with notifications (taps)
   - Listens for dropped notifications
   - Handles deep linking via the router if a URL is provided in the notification data
   - Properly cleans up subscriptions on unmount

2. `useLastNotificationResponse` hook to handle cases where the app was opened from a notification:
   - Checks if there was a notification that launched the app
   - Handles deep linking if applicable

3. `setNotificationHandler` function to configure how notifications should be handled when the app is in the foreground:
   - Shows alerts
   - Plays sounds
   - Updates badge count
   - Includes logging for successful and failed notification handling

Usage example:

```typescript
function App() {
  // Set up notification handler
  setNotificationHandler();

  // Set up notification listeners
  useNotificationListeners({
    onNotificationReceived: (notification) => {
      // Handle received notification
    },
    onNotificationResponseReceived: (response) => {
      // Handle notification response
    },
    onNotificationsDropped: () => {
      // Handle dropped notifications
    },
  });

  // Handle notifications that launched the app
  useLastNotificationResponse();

  return (
    // Your app content
  );
}
```

The implementation follows the code style guide by:
- Using TypeScript types
- Using functional programming patterns
- Including clear comments
- Using the logger for all logging operations
- Using descriptive variable names
- Handling errors appropriately
- Following the proper file structure and naming conventions

---

_**User**_

what is this used for

---

_**Assistant**_

Let me explain the purpose of this notifications listener implementation:

This file sets up the core notification handling system for a React Native/Expo app with three main components:

1. `useNotificationListeners` hook:
   - Handles notifications in different app states:
     - When the app is open (foreground)
     - When user taps on a notification
     - When notifications are dropped by the system
   ```typescript
   useNotificationListeners({
     onNotificationReceived: (notification) => {
       // Called when app is open and notification arrives
     },
     onNotificationResponseReceived: (response) => {
       // Called when user taps on notification
     },
     onNotificationsDropped: () => {
       // Called if system drops notifications
     }
   });
   ```

2. `useLastNotificationResponse` hook:
   - Checks if the app was launched by tapping a notification
   - Useful for handling scenarios where the app was closed/in background and opened via notification
   - Handles deep linking (navigation) if the notification contains a URL

3. `setNotificationHandler` function:
   - Configures how notifications behave when app is in foreground
   - Controls whether notifications should:
     - Show an alert
     - Play a sound
     - Update the app badge count
   - Includes success/error logging for debugging

Example usage in your app:

```typescript
function App() {
  // Configure notification behavior
  setNotificationHandler();

  // Set up notification handling
  useNotificationListeners({
    onNotificationReceived: (notification) => {
      // Example: Show in-app alert for new message
      showAlert(`New message: ${notification.request.content.body}`);
    },
    onNotificationResponseReceived: (response) => {
      // Example: Navigate to specific screen when notification tapped
      const conversationId = response.notification.request.content.data?.conversationId;
      if (conversationId) {
        router.push(`/conversation/${conversationId}`);
      }
    }
  });

  // Handle case where app was opened from notification
  useLastNotificationResponse();

  return <RootNavigator />;
}
```

This implementation is essential for:
- Push notifications
- Local notifications
- Deep linking through notifications
- Handling notifications in different app states (foreground/background/killed)
- Providing a good user experience with notifications
- Debugging notification-related issues through proper logging

The code follows best practices by:
- Using TypeScript for type safety
- Properly cleaning up listeners to prevent memory leaks
- Using refs to maintain listener references
- Providing flexible callback options
- Including comprehensive logging
- Handling deep linking through the router

---

_**User**_

make all the functions more explicty. Like onnotificationsResponseReceived should be onNotificationTapped or something like that no?

---

_**Assistant**_

Yes, making the function names more explicit and descriptive would improve clarity. I'll update the code with more intuitive names.

```typescript:features/notifications/notifications-listeners.ts
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { logger } from "@/utils/logger";
import { router } from "expo-router";

type INotificationListenerCallbacks = {
  onNotificationDisplayedInForeground?: (
    notification: Notifications.Notification
  ) => void;
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void;
  onSystemDroppedNotifications?: () => void;
};

/**
 * Hook to handle all notification listeners in one place:
 * - Notifications displayed while app is in foreground
 * - User tapping on notifications
 * - System dropping notifications due to limits
 */
export function useNotificationListeners({
  onNotificationDisplayedInForeground,
  onNotificationTapped,
  onSystemDroppedNotifications,
}: INotificationListenerCallbacks = {}) {
  const foregroundNotificationListener = useRef<Notifications.Subscription>();
  const notificationTapListener = useRef<Notifications.Subscription>();
  const systemDropListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Listen for notifications while app is in foreground
    foregroundNotificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        logger.debug(
          `[useNotificationListeners] Foreground notification displayed: ${notification.request.identifier}`
        );
        onNotificationDisplayedInForeground?.(notification);
      });

    // Listen for when user taps on a notification
    notificationTapListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const url = response.notification.request.content.data?.url as
          | string
          | undefined;

        logger.debug(
          `[useNotificationListeners] User tapped notification: ${response.notification.request.identifier}`
        );

        // Handle deep linking if URL is present
        if (url) {
          router.push(url);
        }

        onNotificationTapped?.(response);
      });

    // Listen for when system drops notifications
    systemDropListener.current = Notifications.addNotificationsDroppedListener(
      () => {
        logger.debug(
          "[useNotificationListeners] System dropped notifications due to limits"
        );
        onSystemDroppedNotifications?.();
      }
    );

    // Cleanup subscriptions on unmount
    return () => {
      if (foregroundNotificationListener.current) {
        Notifications.removeNotificationSubscription(
          foregroundNotificationListener.current
        );
      }

      if (notificationTapListener.current) {
        Notifications.removeNotificationSubscription(notificationTapListener.current);
      }

      if (systemDropListener.current) {
        Notifications.removeNotificationSubscription(systemDropListener.current);
      }
    };
  }, [
    onNotificationDisplayedInForeground,
    onNotificationTapped,
    onSystemDroppedNotifications,
  ]);
}

/**
 * Hook to handle when app is launched from a notification tap
 */
export function useAppLaunchedFromNotification() {
  useEffect(() => {
    // Check if app was launched by tapping a notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const url = response.notification.request.content.data?.url as
          | string
          | undefined;

        logger.debug(
          `[useAppLaunchedFromNotification] App launched by notification tap: ${response.notification.request.identifier}`
        );

        // Handle deep linking if URL is present
        if (url) {
          router.push(url);
        }
      }
    });
  }, []);
}

/**
 * Configure how notifications behave when app is in foreground:
 * - Show alerts
 * - Play sounds
 * - Update badge count
 */
export function configureForegroundNotificationBehavior() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
    handleSuccess: (notificationId) => {
      logger.debug(
        `[configureForegroundNotificationBehavior] Successfully displayed notification: ${notificationId}`
      );
    },
    handleError: (notificationId, error) => {
      logger.error(
        `[configureForegroundNotificationBehavior] Failed to display notification ${notificationId}: ${error}`
      );
    },
  });
}
```

Key changes made:
1. Renamed the interface from `INotificationListener` to `INotificationListenerCallbacks` to better describe its purpose
2. Made callback names more descriptive:
   - `onNotificationReceived` → `onNotificationDisplayedInForeground`
   - `onNotificationResponseReceived` → `onNotificationTapped`
   - `onNotificationsDropped` → `onSystemDroppedNotifications`
3. Made ref names more explicit:
   - `notificationListener` → `foregroundNotificationListener`
   - `responseListener` → `notificationTapListener`
   - `droppedListener` → `systemDropListener`
4. Renamed exported functions to be more descriptive:
   - `useLastNotificationResponse` → `useAppLaunchedFromNotification`
   - `setNotificationHandler` → `configureForegroundNotificationBehavior`
5. Added more detailed comments explaining each function's purpose

These changes make the code more self-documenting and easier to understand at a glance.

---

_**User**_

why do we need "useAppLaunchedFromNotification" ? couldn't we just listen to when a user tap on a notification and handle this there? Why need this hook useAppLaunchedFromNotification

---

_**Assistant**_

The `useAppLaunchedFromNotification` hook serves a different purpose than the notification tap listener. Here's why we need both:

1. `onNotificationTapped` (in `useNotificationListeners`):
   - Only works when the app is already running (in foreground or background)
   - Handles notification taps when the user interacts with a notification while the app is alive

2. `useAppLaunchedFromNotification`:
   - Handles the specific case where the app was completely closed (killed)
   - When user taps a notification to launch the app from a killed state
   - The regular tap listener won't catch this because the app wasn't running when the tap occurred

Here's a practical example:

```typescript
// Scenario 1: App is running (foreground or background)
useNotificationListeners({
  onNotificationTapped: (response) => {
    // This will work when app is already running
    navigateToMessage(response.notification.request.content.data.messageId);
  }
});

// Scenario 2: App was completely closed
// User taps notification -> App launches -> Need to check if launch was from notification
useAppLaunchedFromNotification();  // Handles the "cold start" scenario
```

Real-world example:
```typescript
// messaging.screen.tsx
export function MessagingScreen() {
  // Handles taps when app is running
  useNotificationListeners({
    onNotificationTapped: (response) => {
      const messageId = response.notification.request.content.data.messageId;
      openMessage(messageId);
    }
  });

  // Handles case where user tapped notification to launch app
  useAppLaunchedFromNotification();
  
  return <MessageList />;
}
```

Without `useAppLaunchedFromNotification`, this scenario would break the user experience:
1. App is closed
2. User receives a notification
3. User taps notification to open app
4. App launches but doesn't navigate to the notification content because the tap listener wasn't active when the app was closed

This is why we need both mechanisms to handle all possible app states when a notification is tapped.

---

_**User**_

ok so this needs to be more clear. Maybe change some functions name ? Like onNotificationTapped is more like onNotificationTappedWhileForgroundOrBackground??

---

_**Assistant**_

Yes, let's make the function names more explicit about when they handle notifications. I'll update the code to be clearer about the app states.

```typescript:features/notifications/notifications-listeners.ts
import * as Notifications from "expo-notifications";
import { useEffect, useRef } from "react";
import { notificationsLogger } from "@/utils/logger";
import { router } from "expo-router";

type INotificationListenerCallbacks = {
  onNotificationDisplayedInForeground?: (
    notification: Notifications.Notification
  ) => void;
  onNotificationTappedWhileRunning?: (
    response: Notifications.NotificationResponse
  ) => void;
  onSystemDroppedNotifications?: () => void;
};

/**
 * Hook to handle notification events while app is running (foreground or background):
 * - Notifications displayed while app is in foreground
 * - User tapping notifications while app is running
 * - System dropping notifications due to limits
 */
export function useNotificationListenersWhileRunning({
  onNotificationDisplayedInForeground,
  onNotificationTappedWhileRunning,
  onSystemDroppedNotifications,
}: INotificationListenerCallbacks = {}) {
  const foregroundNotificationListener = useRef<Notifications.Subscription>();
  const notificationTapListener = useRef<Notifications.Subscription>();
  const systemDropListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Listen for notifications while app is in foreground
    foregroundNotificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        notificationsLogger.debug(
          `[useNotificationListenersWhileRunning] Foreground notification displayed: ${notification.request.identifier}`
        );
        onNotificationDisplayedInForeground?.(notification);
      });

    // Listen for notification taps while app is running
    notificationTapListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const url = response.notification.request.content.data?.url as
          | string
          | undefined;

        notificationsLogger.debug(
          `[useNotificationListenersWhileRunning] User tapped notification while app running: ${response.notification.request.identifier}`
        );

        // Handle deep linking if URL is present
        if (url) {
          router.push(url);
        }

        onNotificationTappedWhileRunning?.(response);
      });

    // Listen for when system drops notifications
    systemDropListener.current = Notifications.addNotificationsDroppedListener(
      () => {
        notificationsLogger.debug(
          "[useNotificationListenersWhileRunning] System dropped notifications due to limits"
        );
        onSystemDroppedNotifications?.();
      }
    );

    // Cleanup subscriptions on unmount
    return () => {
      if (foregroundNotificationListener.current) {
        Notifications.removeNotificationSubscription(
          foregroundNotificationListener.current
        );
      }

      if (notificationTapListener.current) {
        Notifications.removeNotificationSubscription(
          notificationTapListener.current
        );
      }

      if (systemDropListener.current) {
        Notifications.removeNotificationSubscription(
          systemDropListener.current
        );
      }
    };
  }, [
    onNotificationDisplayedInForeground,
    onNotificationTappedWhileRunning,
    onSystemDroppedNotifications,
  ]);
}

/**
 * Hook to handle when app was launched from a killed state by tapping a notification.
 * This is different from onNotificationTappedWhileRunning because it handles the case
 * where the app was completely closed when the user tapped the notification.
 */
export function useNotificationTappedWhileKilled() {
  useEffect(() => {
    // Check if app was launched by tapping a notification while killed
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const url = response.notification.request.content.data?.url as
          | string
          | undefined;

        notificationsLogger.debug(
          `[useNotificationTappedWhileKilled] App launched by notification tap while killed: ${response.notification.request.identifier}`
        );

        // Handle deep linking if URL is present
        if (url) {
          router.push(url);
        }
      }
    });
  }, []);
}

export function configureForegroundNotificationBehavior() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
    handleSuccess: (notificationId) => {
      notificationsLogger.debug(
        `Successfully displayed notification: ${notificationId}`
      );
    },
    handleError: (notificationId, error) => {
      notificationsLogger.error(
        `Failed to display notification ${notificationId}: ${error}`
      );
    },
  });
}
```

Key changes made:
1. Renamed functions to be explicit about app state:
   - `useNotificationListeners` → `useNotificationListenersWhileRunning`
   - `onNotificationTapped` → `onNotificationTappedWhileRunning`
   - `useAppLaunchedFromNotification` → `useNotificationTappedWhileKilled`

2. Updated comments to clearly explain:
   - When each function is triggered
   - The difference between notification taps while running vs killed
   - The app states each function handles

Usage example:
```typescript
function MessagingScreen() {
  // Handle notifications while app is running (foreground/background)
  useNotificationListenersWhileRunning({
    onNotificationTappedWhileRunning: (response) => {
      const messageId = response.notification.request.content.data.messageId;
      openMessage(messageId);
    }
  });

  // Handle case where app was killed and launched via notification
  useNotificationTappedWhileKilled();

  return <MessageList />;
}
```

The names now make it much clearer when each function handles notifications based on the app's state.

---



---

