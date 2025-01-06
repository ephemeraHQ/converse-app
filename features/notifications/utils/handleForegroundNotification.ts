import { currentAccount } from "@data/store/accountsStore";
import { resetNotifications } from "./resetNotifications";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import logger from "@utils/logger";

// note(lustig): these two handlers are the same - do we need both?
const handleiOSForegroundNotification = async (
  notification: Notifications.Notification
) => {
  logger.debug("[Notifications] Handling iOS foreground notification");
  resetNotifications();
  // note(lustig): this is not the senderAddress, but the account to which
  // the notification is to be received.
  const recipientAccount = notification.request.content.data?.["account"];

  const senderAccount =
    /* TODO notification.request.content.data?.["sender"]; */ "todo";
  const userIsNotSender = senderAccount !== getCurrentInboxId();

  const isViewingNotifiedConversation = /* TODO */ false;
  const hackSoWeDontShowNotificationToSender =
    /* todo(lustig): remove once we get senderAddress */ recipientAccount !==
    getCurrentInboxId();
  const shouldShowAlert =
    userIsNotSender &&
    !isViewingNotifiedConversation &&
    hackSoWeDontShowNotificationToSender;

  if (shouldShowAlert) {
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
  if (account && account !== getCurrentInboxId()) {
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
