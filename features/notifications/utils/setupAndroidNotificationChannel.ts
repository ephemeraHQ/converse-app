import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import notifee from "@notifee/react-native";

export const setupAndroidNotificationChannel = async () => {
  if (Platform.OS !== "android") return;

  // Delete legacy default channel
  await Notifications.deleteNotificationChannelAsync("default");

  // Create new channel and showBadge set to true
  // await Notifications.setNotificationChannelAsync("converse-notifications", {
  //   name: "Converse Notifications",
  //   importance: Notifications.AndroidImportance.MAX,
  //   showBadge: true,
  // });
  await notifee.createChannel({
    id: "converse-notifications",
    name: "Converse Notifications",
    lights: false,
    vibration: true,
    // importance: AndroidImportance.DEFAULT,
  });
};
