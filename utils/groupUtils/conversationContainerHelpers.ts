import {
  ConversationContainerWithCodecsType,
  DmWithCodecsType,
  GroupWithCodecsType,
} from "@utils/xmtpRN/client";
import { ConversationVersion } from "@xmtp/react-native-sdk";

export const unwrapConversationContainer = (
  conversation: ConversationContainerWithCodecsType
) => {
  if (conversationIsGroup(conversation)) {
    return conversation as GroupWithCodecsType;
  }
  return conversation as DmWithCodecsType;
};

export const conversationIsGroup = (
  conversation: ConversationContainerWithCodecsType
) => {
  return conversation.version === ConversationVersion.GROUP;
};
