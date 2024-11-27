import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { GroupWithCodecsType } from "@utils/xmtpRN/client";
import { getGroupByTopicByAccount } from "@utils/xmtpRN/conversations";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { conversationQueryKey } from "./QueryKeys";

export const useGroupQuery = (
  account: string,
  topic: ConversationTopic,
  includeSync = false,
  options?: Partial<UseQueryOptions<GroupWithCodecsType | null | undefined>>
) => {
  return useQuery({
    ...options,
    queryKey: conversationQueryKey(account, topic!),
    queryFn: async () => {
      if (!topic) {
        return null;
      }
      return getGroupByTopicByAccount({
        account,
        topic,
        includeSync,
      });
    },
    enabled: !!topic,
  });
};
