import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { GroupWithCodecsType } from "@utils/xmtpRN/client";
import type { ConversationTopic } from "@xmtp/react-native-sdk";
import { conversationQueryKey } from "./QueryKeys";
import { getGroupByTopicByAccount } from "@utils/xmtpRN/conversations";

export const useGroupQuery = (
  account: string,
  topic: ConversationTopic | undefined,
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
