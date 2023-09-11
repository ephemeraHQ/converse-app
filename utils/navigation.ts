import * as Linking from "expo-linking";

import { XmtpConversation } from "../data/store/chatStore";
import { loadSavedNotificationMessagesToContext } from "./notifications";

export const navigateToConversation = async (
  conversation: XmtpConversation
) => {
  await loadSavedNotificationMessagesToContext();
  Linking.openURL(
    Linking.createURL("/conversation", {
      queryParams: {
        topic: conversation.topic,
      },
    })
  );
};
