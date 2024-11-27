import { currentAccount } from "@data/store/accountsStore";
import { resetNotifications } from "./resetNotifications";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import logger from "@utils/logger";

const handleiOSForegroundNotification = async (
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

const handleDefaultForegroundNotification = async (
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

export const handleForegroundNotification = async (
  notification: Notifications.Notification
) => {
  logger.info("A NOTIFICATION WAS RECEIVED WHILE THE APP WAS FOREGROUNDED");
  return Platform.select({
    ios: handleiOSForegroundNotification(notification),
    default: handleDefaultForegroundNotification(notification),
  });
};
