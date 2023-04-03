import { Client, Conversation } from "@xmtp/xmtp-js";
import {
  ConversationV2 as ConversationV2Type,
  ConversationV1 as ConversationV1Type,
} from "@xmtp/xmtp-js/dist/types/src/conversations";

const {
  ConversationV1,
  ConversationV2,
} = require("@xmtp/xmtp-js/dist/esm/src/conversations/Conversation");

export const parseConversationJSON = (
  xmtpClient: Client,
  savedConversation: string
): Conversation => {
  let parsedConversation: any = {};
  try {
    parsedConversation = JSON.parse(savedConversation);
  } catch (e: any) {
    console.log(e);
    throw new Error("Could not parse saved conversation");
  }
  if (parsedConversation.version === "v1") {
    const conversationV1: ConversationV1Type = ConversationV1.fromExport(
      xmtpClient,
      parsedConversation
    );
    return conversationV1;
  } else if (parsedConversation.version === "v2") {
    const conversationV2: ConversationV2Type = ConversationV2.fromExport(
      xmtpClient,
      parsedConversation
    );
    return conversationV2;
  }
  throw new Error(
    `Conversation version ${parsedConversation.version} not handled`
  );
};
