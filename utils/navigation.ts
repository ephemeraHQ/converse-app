import * as Linking from "expo-linking";

import { currentAccount, getChatStore } from "../data/store/accountsStore";
import { XmtpConversation } from "../data/store/chatStore";
import { loadSavedNotificationMessagesToContext } from "./notifications";

export let topicToNavigateTo = "";
export const setTopicToNavigateTo = (topic: string) => {
  topicToNavigateTo = topic;
};

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

export const navigateToTopicWithRetry = async () => {
  if (!topicToNavigateTo) return;
  let conversationToNavigateTo = getChatStore(currentAccount()).getState()
    .conversations[topicToNavigateTo];
  let currentAttempt = 0;

  while (
    !conversationToNavigateTo &&
    currentAttempt < 10 &&
    topicToNavigateTo
  ) {
    currentAttempt += 1;
    await new Promise((r) => setTimeout(r, 250));
    conversationToNavigateTo = getChatStore(currentAccount()).getState()
      .conversations[topicToNavigateTo];
  }

  if (topicToNavigateTo && conversationToNavigateTo) {
    navigateToConversation(conversationToNavigateTo);
  }
};
