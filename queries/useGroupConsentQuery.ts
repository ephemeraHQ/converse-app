import { useQuery } from "@tanstack/react-query";

import { groupConsentQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { useGroupQuery } from "./useGroupQuery";

type Consent = "allowed" | "denied" | "unknown";

export const useGroupConsentQuery = (account: string, topic: string) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery({
    queryKey: groupConsentQueryKey(account, topic),
    queryFn: async () => {
      if (!group) {
        return;
      }
      return group.consentState();
    },
    enabled: !!group,
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
