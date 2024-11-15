import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { handleNotification } from "./handleNotification";
import { onInteractWithNotification } from "./onInteractWithNotification";
import notifee, { AndroidVisibility, EventType } from "@notifee/react-native";

console.log("here1111 index");

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

// // This handler determines how the app handles
// // notifications that come in while the app is foregrounded
// Notifications.setNotificationHandler({
//   handleNotification,
//   handleSuccess: () => {
//     console.log("here1111 handleSuccess");
//   },
//   handleError: (notificationId, error) => {
//     console.log("here1111 handleError", notificationId, error);
//   },
// });

// // This handler determines how the app handles
// // notifications that have been clicked on
// Notifications.addNotificationResponseReceivedListener(
//   onInteractWithNotification
// );

// TaskManager.defineTask(
//   BACKGROUND_NOTIFICATION_TASK,
//   ({ data, error, executionInfo }) => {
//     data.notification.data.message = "sadfosdfiobsdfosa";
//     const notification = (data as any)
//       ?.notification as Notifications.Notification;
//     console.log(
//       "here1111Received a notification in the background!",
//       data,
//       executionInfo
//     );
//     // Do something with the notification data
//   }
// );

// Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
// Notifications.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);

notifee.createChannel({
  id: "converse-notifications",
  name: "Converse Notifications",
});

notifee.onForegroundEvent(async ({ type, detail }) => {
  console.log("here1111 onForegroundEvent", type, detail);
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log("here1111 onBackgroundEvent", type, detail);
  const { notification, pressAction } = detail;

  // Check if the user pressed the "Mark as read" action
  // if (type === EventType.ACTION_PRESS && pressAction?.id === "mark-as-read") {
  //   // Update external API
  //   await fetch(`https://my-api.com/chat/${notification?.data?.chatId}/read`, {
  //     method: "POST",
  //   });

  // Remove the notification
  // await notifee.cancelNotification(notification?.id ?? "");
  // }
});

setTimeout(() => {
  console.log("here1111 displayNotification");
  try {
    notifee.requestPermission().then(() => {
      // Create a channel (required for Android)
      notifee
        .createChannel({
          id: "default",
          name: "Default Channel",
        })
        .then((channelId) => {
          // Display a notification
          notifee
            .displayNotification({
              title: "Notification Title",
              body: "Main body content of the notification",
              android: {
                channelId,
                smallIcon: "ic_launcher", // optional, defaults to 'ic_launcher'.
                pressAction: {
                  id: "default",
                },
                visibility: AndroidVisibility.PUBLIC,
              },
            })
            .then(() => {
              console.log("here1111 displayNotification success");
            })
            .catch((error) => {
              console.log("here1111 displayNotification error", error);
            });
        });
    });
  } catch (error) {
    console.log("here1111 error", error);
  }
}, 5000);
