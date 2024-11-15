import { currentAccount } from "@data/store/accountsStore";
import { resetNotifications } from "./resetNotifications";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const handleiOSNotification = async (
  notification: Notifications.Notification
) => {
  resetNotifications();
  const account = notification.request.content.data?.["account"];
  if (account && account !== currentAccount()) {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  } else {
    return {
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    };
  }
};

const handleDefaultNotification = async (
  notification: Notifications.Notification
) => {
  resetNotifications();
  const account = notification.request.content.data?.["account"];
  if (account && account !== currentAccount()) {
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  } else {
    return {
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    };
  }
};

export const handleNotification = async (
  notification: Notifications.Notification
) => {
  console.log("here1111 shouldShowNotificationForeground", notification);

  return Platform.select({
    ios: handleiOSNotification(notification),
    default: handleDefaultNotification(notification),
  });
};
