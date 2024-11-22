import * as Notifications from "expo-notifications";
import { defineTask } from "expo-task-manager";
import { registerTaskAsync } from "expo-notifications";
import { AppState, Platform } from "react-native";
import logger from "@utils/logger";
import { handleForegroundNotification } from "./handleForegroundNotification";
import { onInteractWithNotification } from "./onInteractWithNotification";
import { handleBackgroundNotification } from "./background/handleBackgroundNotification";
import notifee, { EventType } from "@notifee/react-native";

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

// This handler determines how the app handles
// notifications that come in while the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: handleForegroundNotification,
});

// This handler determines how the app handles
// notifications that have been clicked on
Notifications.addNotificationResponseReceivedListener(
  onInteractWithNotification
);

// On Android, we handle background notifications in JS
// while on iOS, we handle them directly in Swift
if (Platform.OS === "android") {
  defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
    if (error) {
      logger.error(
        `${Platform.OS} ${BACKGROUND_NOTIFICATION_TASK}: Error! ${JSON.stringify(
          error
        )}`
      );
      return;
    }
    if (AppState.currentState === "active") return;
    const notificationBody = (data as any).notification.data.body as
      | string
      | undefined;
    handleBackgroundNotification(notificationBody);
  });

  registerTaskAsync(BACKGROUND_NOTIFICATION_TASK)
    .then(() => {
      logger.debug(
        `Notifications.registerTaskAsync success: ${BACKGROUND_NOTIFICATION_TASK}`
      );
    })
    .catch((reason) => {
      logger.error(`Notifications registerTaskAsync failed: ${reason}`);
    });

  notifee.onBackgroundEvent(async () => {
    // This will get triggered for all background events,
    // including displaying & clicking on notifications
    // which is currently handled in onInteractWithNotification
    // However this will silence the notifee warning so keeping it
  });
}
