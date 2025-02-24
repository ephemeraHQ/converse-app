import { useQuery } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { getGroupQueryOptions } from "@/queries/useGroupQuery";

export const useGroupNameQuery = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  return useQuery({
    ...getGroupQueryOptions({ account, topic }),
    select: (group) => (isConversationGroup(group) ? group.name : undefined),
  });
};
