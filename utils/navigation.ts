import { currentAccount, getChatStore } from "../data/store/accountsStore";
import { XmtpConversation } from "../data/store/chatStore";
import { NavigationParamList } from "../screens/Navigation/Navigation";
import { loadSavedNotificationMessagesToContext } from "./notifications";

export const converseNavigations: { [navigationName: string]: any } = {};

export const navigate = async <T extends keyof NavigationParamList>(
  screen: T,
  params?: NavigationParamList[T]
) => {
  // Navigate to a screen in all navigators
  // like Linking.openURL but without redirect on web
  Object.values(converseNavigations).forEach((navigation) => {
    navigation.navigate(screen, params);
  });
};

export let topicToNavigateTo = "";
export const setTopicToNavigateTo = (topic: string) => {
  topicToNavigateTo = topic;
};

export const navigateToConversation = async (
  conversation: XmtpConversation
) => {
  await loadSavedNotificationMessagesToContext();
  navigate("Conversation", { topic: conversation.topic });
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
