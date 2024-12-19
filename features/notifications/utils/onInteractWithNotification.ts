import * as Notifications from "expo-notifications";
import {
  navigate,
  navigateToTopic,
  setTopicToNavigateTo,
} from "@utils/navigation";
import { getTopicFromV3Id } from "@utils/groupUtils/groupId";
import { useAccountsStore } from "@data/store/accountsStore";
import type { ConversationId, ConversationTopic } from "@xmtp/react-native-sdk";
import { fetchPersistedConversationListQuery } from "@/queries/useConversationListQuery";
import { resetNotifications } from "./resetNotifications";

export const onInteractWithNotification = async (
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
    notificationData = JSON.parse(notificationData.body) as Record<string, any>;
  }
  // Handling notifee notifications which look a bit different
  if ("notifee_event_type" in notificationData) {
    notificationData = notificationData.notification.data;
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
          topic: getTopicFromV3Id(groupId as ConversationId),
        });
      } else {
        return;
      }
    }
  }
  const conversationTopic = notificationData["contentTopic"] as
    | string
    | undefined;

  if (conversationTopic) {
    // todo(lustig): zod verification of external payloads such as those from
    // notifications, deep links, etc
    const account: string =
      notificationData["account"] || useAccountsStore.getState().currentAccount;

    // Fetch the conversation list to ensure we have the latest conversation list
    // before navigating to the conversation
    await fetchPersistedConversationListQuery({ account });
    useAccountsStore.getState().setCurrentAccount(account, false);

    navigateToTopic(conversationTopic as ConversationTopic);
    setTopicToNavigateTo(undefined);
    resetNotifications();
  }
};
