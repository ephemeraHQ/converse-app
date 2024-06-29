import { useQuery } from "@tanstack/react-query";
import { InboxId } from "@xmtp/react-native-sdk/build/lib/Client";

import { addedByQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { useGroupQuery } from "./useGroupQuery";

type AddedByRawData = InboxId | undefined;

export const useAddedByQuery = (account: string, topic: string) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery<AddedByRawData>({
    queryKey: addedByQueryKey(account, topic),
    queryFn: async () => {
      if (!group) {
        return;
      }
      const inboxId = await group.addedByInboxId();
      return inboxId;
    },
    enabled: !!group,
  });
};

export const getAddedByQueryData = (
  account: string,
  topic: string
): AddedByRawData | undefined =>
  queryClient.getQueryData(addedByQueryKey(account, topic));

export const setAddedByQueryData = (
  account: string,
  topic: string,
  members: AddedByRawData
) => {
  queryClient.setQueryData(addedByQueryKey(account, topic), members);
};

export const cancelAddedByQuery = async (account: string, topic: string) => {
  return queryClient.cancelQueries({
    queryKey: addedByQueryKey(account, topic),
  });
};

export const invalidateAddedByQuery = (account: string, topic: string) => {
  return queryClient.invalidateQueries({
    queryKey: addedByQueryKey(account, topic),
  });
};
