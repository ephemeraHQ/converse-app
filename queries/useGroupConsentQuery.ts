import { useQuery } from "@tanstack/react-query";
import { getGroupIdFromTopic } from "@utils/groupUtils/groupId";

import { groupConsentQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { useClient } from "./useClient";

type Consent = "allowed" | "denied" | "unknown";

export const useGroupConsentQuery = (account: string, topic: string) => {
  const client = useClient(account);
  return useQuery({
    queryKey: groupConsentQueryKey(account, topic),
    queryFn: async () => {
      if (!client) {
        return;
      }
      const groupId = getGroupIdFromTopic(topic);
      const isAllowed = await client.contacts.isGroupAllowed(groupId);
      if (isAllowed) {
        return "allowed";
      }
      const isDenied = await client.contacts.isGroupDenied(groupId);
      if (isDenied) {
        return "denied";
      }
      return "unknown";
    },
    enabled: !!client,
  });
};

export const getGroupConsentQueryData = (
  account: string,
  topic: string
): Consent | undefined =>
  queryClient.getQueryData(groupConsentQueryKey(account, topic));

export const setGroupConsentQueryData = (
  account: string,
  topic: string,
  consent: Consent
) => {
  queryClient.setQueryData(groupConsentQueryKey(account, topic), consent);
};

export const cancelGroupConsentQuery = async (
  account: string,
  topic: string
) => {
  await queryClient.cancelQueries({
    queryKey: groupConsentQueryKey(account, topic),
  });
};

export const invalidateGroupConsentQuery = async (
  account: string,
  topic: string
) => {
  return queryClient.invalidateQueries({
    queryKey: groupConsentQueryKey(account, topic),
  });
};
