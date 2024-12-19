import { useConversationListGroupItem } from "@hooks/useConversationListGroupItem";
import { conversationIsGroup } from "@utils/groupUtils/conversationContainerHelpers";
import {
  DmWithCodecsType,
  GroupWithCodecsType,
} from "@/utils/xmtpRN/client.types";
import React from "react";
import { PinnedV3GroupConversation } from "./PinnedV3GroupConversation";
import { PinnedV3DMConversation } from "./PinnedV3DMConversation";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

type PinnedV3ConversationProps = {
  topic: string;
};

export const PinnedV3Conversation = ({ topic }: PinnedV3ConversationProps) => {
  const conversation = useConversationListGroupItem(topic as ConversationTopic);
  if (!conversation) {
    return null;
  }
  if (conversationIsGroup(conversation)) {
    return (
      <PinnedV3GroupConversation group={conversation as GroupWithCodecsType} />
    );
  }
  return (
    <PinnedV3DMConversation conversation={conversation as DmWithCodecsType} />
  );
};
