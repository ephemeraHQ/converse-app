import { useQuery } from "@tanstack/react-query";

import { groupPinnedFrameQueryKey } from "./QueryKeys";
import { useGroupQuery } from "./useGroupQuery";

export const useGroupPinnedFrameQuery = (account: string, topic: string) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery({
    queryKey: groupPinnedFrameQueryKey(account, topic),
    queryFn: async () => {
      if (!group) {
        return;
      }
      return "";
      // return group.groupPinnedFrame();
    },
    enabled: !!group,
  });
};
