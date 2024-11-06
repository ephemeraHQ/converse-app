import { useSettingsStore } from "@data/store/accountsStore";
import { QueryObserverOptions, useQuery } from "@tanstack/react-query";
import { getV3IdFromTopic } from "@utils/groupUtils/groupId";
import { useShallow } from "zustand/react/shallow";

import { groupConsentQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { useGroupQuery } from "./useGroupQuery";

export type Consent = "allowed" | "denied" | "unknown";

export const useGroupConsentQuery = (
  account: string,
  topic: string,
  queryOptions?: Partial<QueryObserverOptions<"allowed" | "denied" | "unknown">>
) => {
  const statusFromState = useSettingsStore(
    useShallow((s) => s.groupStatus[getV3IdFromTopic(topic)])
  );
  const { data: group } = useGroupQuery(account, topic);
  return useQuery({
    queryKey: groupConsentQueryKey(account, topic),
    queryFn: async () => {
      const consent = await group!.consentState();
      return consent;
    },
    enabled: !!group,
    initialData: statusFromState ?? "unknown",
    ...queryOptions,
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
