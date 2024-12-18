import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { getGroupQueryOptions } from "@/queries/useGroupQuery";
import { useQuery } from "@tanstack/react-query";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

export const useGroupIsActiveQuery = (args: {
  account: string;
  topic: ConversationTopic;
}) => {
  const { account, topic } = args;
  return useQuery({
    ...getGroupQueryOptions({ account, topic }),
    select: (group) =>
      isConversationGroup(group) ? group.isGroupActive : undefined,
  });
};
