import { useQuery } from "@tanstack/react-query";

import { groupPinnedFrameQueryKey } from "./QueryKeys";
import { useGroupQuery } from "@queries/useGroupQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

export const useGroupPinnedFrameQuery = (
  account: string,
  topic: ConversationTopic | undefined
) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery({
    queryKey: groupPinnedFrameQueryKey(account, topic!),
    queryFn: async () => {
      if (!group || !topic) {
        return;
      }
      return "";
      // return group.groupPinnedFrame();
    },
    enabled: !!group && !!topic,
  });
};
