// On web we can't use the db but we have a lot less messages locally
// so we can just find the messages to send in the local state

import { getChatStore } from "../../store/accountsStore";
import { XmtpMessage } from "../../store/chatStore";

export const getMessagesToSend = async (account: string) => {
  const messagesToSend: XmtpMessage[] = [];
  Object.values(getChatStore(account).getState().conversations).forEach(
    (conversation) => {
      conversation.messages?.forEach((message) => {
        if (message.status === "sending") {
          messagesToSend.push(message);
        }
      });
    }
  );
  return messagesToSend;
};
