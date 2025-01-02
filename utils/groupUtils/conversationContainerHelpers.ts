import {
  ConversationWithCodecsType,
  DmWithCodecsType,
  GroupWithCodecsType,
} from "../xmtpRN/client.types";
import { ConversationVersion } from "@xmtp/react-native-sdk";

export const unwrapConversationContainer = (
  conversation: ConversationWithCodecsType
) => {
  if (conversationIsGroup(conversation)) {
    return conversation as GroupWithCodecsType;
  }
  return conversation as DmWithCodecsType;
};

export const conversationIsGroup = (
  conversation: ConversationWithCodecsType
) => {
  return conversation.version === ConversationVersion.GROUP;
};
