import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { getGroupQueryOptions } from "@/queries/useGroupQuery";
import { useQuery } from "@tanstack/react-query";
import type { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";

export const useGroupDescriptionQuery = (args: {
  inboxId: InboxId;
  topic: ConversationTopic;
}) => {
  const { inboxId, topic } = args;
  return useQuery({
    ...getGroupQueryOptions({ inboxId, topic }),
    select: (group) =>
      isConversationGroup(group) ? group.description : undefined,
  });
};
