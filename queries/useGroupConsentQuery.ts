import { QueryObserverOptions, useQuery } from "@tanstack/react-query";

import { groupConsentQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";
import { useGroupQuery } from "@queries/useGroupQuery";
import type { ConversationTopic } from "@xmtp/react-native-sdk";

export type Consent = "allowed" | "denied" | "unknown";

export const useGroupConsentQuery = (
  account: string,
  topic: ConversationTopic | undefined,
  queryOptions?: Partial<QueryObserverOptions<"allowed" | "denied" | "unknown">>
) => {
  const { data: group } = useGroupQuery(account, topic);
  return useQuery({
    queryKey: groupConsentQueryKey(account, topic!),
    queryFn: async () => {
      const consent = await group!.consentState();
      return consent;
    },
    enabled: !!group && !!topic,
    initialData: group?.state,
    ...queryOptions,
  });
};

export const getGroupConsentQueryData = (
  account: string,
  topic: ConversationTopic
): Consent | undefined =>
  queryClient.getQueryData(groupConsentQueryKey(account, topic));

export const setGroupConsentQueryData = (
  account: string,
  topic: ConversationTopic,
  consent: Consent
) => {
  queryClient.setQueryData(groupConsentQueryKey(account, topic), consent);
};

export const cancelGroupConsentQuery = async (
  account: string,
  topic: ConversationTopic
) => {
  await queryClient.cancelQueries({
    queryKey: groupConsentQueryKey(account, topic),
  });
};

export const invalidateGroupConsentQuery = async (
  account: string,
  topic: ConversationTopic
) => {
  return queryClient.invalidateQueries({
    queryKey: groupConsentQueryKey(account, topic),
  });
};
