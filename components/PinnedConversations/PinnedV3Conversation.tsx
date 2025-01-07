import { useConversationListGroupItem } from "@hooks/useConversationListGroupItem";
import React from "react";
import { PinnedV3GroupConversation } from "./PinnedV3GroupConversation";
import { PinnedV3DMConversation } from "./PinnedV3DMConversation";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";

type PinnedV3ConversationProps = {
  topic: string;
};

export const PinnedV3Conversation = ({ topic }: PinnedV3ConversationProps) => {
  const conversation = useConversationListGroupItem(topic as ConversationTopic);
  if (!conversation) {
    return null;
  }
  if (isConversationGroup(conversation)) {
    return <PinnedV3GroupConversation group={conversation} />;
  }
  return <PinnedV3DMConversation conversation={conversation} />;
};
