import { conversationConsentState } from "@xmtp/react-native-sdk";

import { getChatStore } from "../../data/store/accountsStore";

const logConsentStatesForAccount = async (account: string) => {
  const conversations = getChatStore(account).getState().conversations;

  for (const topic in conversations) {
    if (conversations.hasOwnProperty(topic)) {
      const conversation = conversations[topic];
      try {
        const consentState = await conversationConsentState(
          account,
          conversation.topic
        );
        console.log(
          `Topic: ${topic}, Consent State: ${JSON.stringify(consentState)}`
        );
      } catch (error) {
        console.error(
          `Error fetching consent state for topic: ${topic}`,
          error
        );
      }
    }
  }
};

export const setConsent = async (account: string) => {
  console.log("[Async Updates] Running 001-setConsent, account:", account);
  logConsentStatesForAccount(account);
};
