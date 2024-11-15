import * as Notifications from "expo-notifications";
import {
  navigate,
  navigateToConversation,
  setTopicToNavigateTo,
} from "@utils/navigation";
import { getTopicFromGroupId } from "@utils/groupUtils/groupId";
import { useAccountsStore, getChatStore } from "@data/store/accountsStore";

export const onInteractWithNotification = (
  event: Notifications.NotificationResponse
) => {
  let notificationData = event.notification.request.content.data;
  // Android returns the data in the body as a string
  if (
    notificationData &&
    typeof notificationData === "object" &&
    "body" in notificationData &&
    typeof notificationData["body"] === "string"
  ) {
    notificationData = JSON.parse(notificationData.body);
  }
  // Handling for data/silent notifications
  if (!notificationData) {
    const payload =
      event.notification?.request.trigger &&
      typeof event.notification.request.trigger === "object" &&
      "payload" in event.notification.request.trigger
        ? event.notification.request.trigger.payload
        : undefined;
    if (!payload) {
      return;
    }
    const payloadType = payload["type"];
    if (payloadType === "group_join_request") {
      const groupId = payload["groupId"] as string;
      if (typeof groupId === "string") {
        return navigate("Group", {
          topic: getTopicFromGroupId(groupId),
        });
      } else {
        return;
      }
    }
  }
  const conversationTopic = notificationData["contentTopic"] as
    | string
    | undefined;
  const account =
    notificationData["account"] || useAccountsStore.getState().currentAccount;

  if (conversationTopic) {
    useAccountsStore.getState().setCurrentAccount(account, false);
    const conversations = getChatStore(account).getState().conversations;

    if (conversations[conversationTopic]) {
      navigateToConversation(conversations[conversationTopic]);
    } else {
      // App was probably not loaded!
      setTopicToNavigateTo(conversationTopic);
    }
  }
};
