import * as Notifications from "expo-notifications";
import { defineTask } from "expo-task-manager";
import { registerTaskAsync } from "expo-notifications";
import { AppState, Platform } from "react-native";
import logger from "@utils/logger";
import { handleForegroundNotification } from "./handleForegroundNotification";
import { onInteractWithNotification } from "./onInteractWithNotification";
import { handleBackgroundNotification } from "./handleBackgroundNotification";

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
    // if (AppState.currentState === "active") return;
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
}

// const displaySampleNotification = async (data: unknown) => {
//   try {
//     const channelId = await notifee.createChannel({
//       id: "default",
//       name: "Default Channel",
//     });
//     console.log("Channel created:", channelId);

//     try {
//       // Display a notification
//       await notifee.displayNotification({
//         title: `The stat is ${AppState.currentState}`,
//         body: "Main body content of the notification",
//         android: {
//           channelId,
//           smallIcon: "ic_launcher", // optional, defaults to 'ic_launcher'.
//           pressAction: {
//             id: "default",
//           },
//           visibility: AndroidVisibility.PUBLIC,
//         },
//       });
//       console.log("displayNotification success");
//     } catch (displayError) {
//       console.log("displayNotification error:", displayError);
//     }
//   } catch (channelError) {
//     console.log("createChannel error:", channelError);
//   }
// };
