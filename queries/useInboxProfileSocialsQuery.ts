import { ProfileSocials } from "@data/store/profilesStore";
import { useQueries, useQuery } from "@tanstack/react-query";
import { getProfilesForInboxIds } from "@utils/api";
import {
  create,
  windowedFiniteBatchScheduler,
  indexedResolver,
} from "@yornaath/batshit";

import { queryClient } from "./queryClient";
import { InboxId } from "@xmtp/react-native-sdk";
import { reactQueryPersister } from "@/utils/mmkv";

const profileSocialsQueryKey = (account: string, peerAddress: string) => [
  "inboxProfileSocials",
  account,
  peerAddress,
];

const profileSocials = create({
  fetcher: async (inboxIds: InboxId[]) => {
    const data = await getProfilesForInboxIds({ inboxIds });
    return data;
  },
  resolver: indexedResolver(),
  scheduler: windowedFiniteBatchScheduler({
    windowMs: 10,
    maxBatchSize: 150,
  }),
});

const fetchInboxProfileSocials = async (inboxIds: InboxId) => {
  const data = await profileSocials.fetch(inboxIds);
  return data;
};

const inboxProfileSocialsQueryConfig = (
  account: string,
  inboxId: InboxId | undefined
) => ({
  queryKey: profileSocialsQueryKey(account, inboxId!),
  queryFn: () => fetchInboxProfileSocials(inboxId!),
  enabled: !!account && !!inboxId,
  // Store for 30 days
  gcTime: 1000 * 60 * 60 * 24 * 30,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: false,
  // We really just want a 24 hour cache here
  // And automatic retries if there was an error fetching
  refetchOnMount: false,
  staleTime: 1000 * 60 * 60 * 24,
  persister: reactQueryPersister,
});

export const useInboxProfileSocialsQuery = (
  account: string,
  inboxId: InboxId | undefined
) => {
  return useQuery(inboxProfileSocialsQueryConfig(account, inboxId));
};

export const useInboxProfileSocialsQueries = (
  account: string,
  inboxIds: InboxId[]
) => {
  return useQueries({
    queries: inboxIds.map((inboxId) =>
      inboxProfileSocialsQueryConfig(account, inboxId)
    ),
  });
};

export const fetchInboxProfileSocialsQuery = (
  account: string,
  inboxId: InboxId
) => {
  return queryClient.fetchQuery(
    inboxProfileSocialsQueryConfig(account, inboxId)
  );
};

export const setInboxProfileSocialsQueryData = (
  account: string,
  inboxId: InboxId,
  data: ProfileSocials,
  updatedAt?: number
) => {
  return queryClient.setQueryData(
    inboxProfileSocialsQueryConfig(account, inboxId).queryKey,
    data,
    {
      updatedAt,
    }
  );
};

export const getInboxProfileSocialsQueryData = (
  account: string,
  inboxId: InboxId
): ProfileSocials[] | null => {
  return (
    queryClient.getQueryData(
      inboxProfileSocialsQueryConfig(account, inboxId).queryKey
    ) ?? null
  );
};
