import { useQuery } from "@tanstack/react-query";
import { MessageDeliveryStatus } from "@xmtp/react-native-sdk";

import { groupPendingMessagesQueryKey } from "./QueryKeys";
import { useGroupQuery } from "./useGroupQuery";

export const useGroupPendingMessages = (account: string, topic: string) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery({
    queryKey: groupPendingMessagesQueryKey(account, topic),
    queryFn: async () => {
      if (!group) {
        return;
      }
      const messages = await group.messages({
        deliveryStatus: MessageDeliveryStatus.UNPUBLISHED,
      });
      return messages;
    },
  });
};
