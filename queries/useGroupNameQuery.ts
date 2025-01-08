import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { getGroupQueryOptions } from "@/queries/useGroupQuery";
import { useQuery } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";

export const useGroupNameQuery = (args: {
  inboxId: string | undefined;
  topic: ConversationTopic;
}) => {
  const { inboxId, topic } = args;
  return useQuery({
    ...getGroupQueryOptions({ inboxId, topic }),
    select: (group) => (isConversationGroup(group) ? group.name : undefined),
  });
};
