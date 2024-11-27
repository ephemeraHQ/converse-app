import { useGroupQuery } from "@queries/useGroupQuery";
import { QueryObserverOptions, useQuery } from "@tanstack/react-query";
import type { ConsentState, ConversationTopic } from "@xmtp/react-native-sdk";
import { groupConsentQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";

type GroupConsentQueryData = ConsentState;

export const useGroupConsentQuery = (
  account: string,
  topic: ConversationTopic,
  queryOptions?: Partial<QueryObserverOptions<ConsentState>>
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
) => queryClient.getQueryData(groupConsentQueryKey(account, topic));

export const setGroupConsentQueryData = (
  account: string,
  topic: ConversationTopic,
  consent: ConsentState
) => {
  queryClient.setQueryData<GroupConsentQueryData>(
    groupConsentQueryKey(account, topic),
    consent
  );
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
