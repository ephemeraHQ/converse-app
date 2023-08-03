import * as Linking from "expo-linking";

import { sendMessageToWebview } from "../components/XmtpWebview";
import { XmtpConversation } from "../data/store/chatStore";
import { loadSavedNotificationMessagesToContext } from "./backgroundNotifications/loadSavedNotifications";
import { lastValueInMap } from "./map";

export const navigateToConversation = async (
  conversation: XmtpConversation
) => {
  const lastTimestamp =
    conversation.messages?.size > 0
      ? lastValueInMap(conversation.messages)?.sent || 0
      : 0;
  await loadSavedNotificationMessagesToContext();
  sendMessageToWebview("SYNC_CONVERSATION", {
    conversationTopic: conversation.topic,
    lastTimestamp,
  });
  Linking.openURL(
    Linking.createURL("/conversation", {
      queryParams: {
        topic: conversation.topic,
      },
    })
  );
};
