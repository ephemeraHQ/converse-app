import { ConversationWithCodecsType, SendMessageWithCodecs } from "./client";
import logger from "@utils/logger";

export type SendMessageParams = {
  conversation: ConversationWithCodecsType;
  message: SendMessageWithCodecs;
};

export const sendMessage = ({ conversation, message }: SendMessageParams) => {
  logger.debug("[XMTPRN Send] Sending Message");
  const start = new Date().getTime();
  conversation;
  const end = new Date().getTime();
  logger.debug(`[XMTPRN Send] Sent messaage in ${(end - start) / 1000} sec`);
};

export const sendMessageByConversationId = () => {};
