import * as Linking from "expo-linking";

import { sendMessageToWebview } from "../components/XmtpWebview";
import { DispatchType } from "../data/deprecatedStore/context";
import { XmtpConversation } from "../data/deprecatedStore/xmtpReducer";
import { loadSavedNotificationMessagesToContext } from "./backgroundNotifications/loadSavedNotifications";
import { lastValueInMap } from "./map";

export const navigateToConversation = async (
  dispatch: DispatchType,
  conversation: XmtpConversation
) => {
  const lastTimestamp =
    conversation.messages?.size > 0
      ? lastValueInMap(conversation.messages)?.sent || 0
      : 0;
  await loadSavedNotificationMessagesToContext(dispatch);
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
