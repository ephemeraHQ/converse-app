import { IProfileSocials } from "@/features/profiles/profile-types";
import { QueryKey, useQueries, useQuery } from "@tanstack/react-query";
import { getProfilesForInboxIds } from "@/utils/api/profiles";
import {
  create,
  windowedFiniteBatchScheduler,
  indexedResolver,
} from "@yornaath/batshit";

import { queryClient } from "./queryClient";
import { InboxId } from "@xmtp/react-native-sdk";
import mmkv from "@/utils/mmkv";
import { createPersister } from "./utils/persistence";

const profileSocialsPersister = createPersister<IProfileSocials[]>({
  name: "profileSocials",
});

const profileSocialsQueryKey = (peerAddress: string): QueryKey => [
  "inboxProfileSocials",
  peerAddress?.toLowerCase(),
];

export const inboxProfileSocialsQueryStorageKey = (inboxId: InboxId) =>
  `tanstack-query-${JSON.stringify(profileSocialsQueryKey(inboxId))}`;

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

const fetchInboxProfileSocials = async (
  inboxId: InboxId
): Promise<IProfileSocials[] | null> => {
  const data = await profileSocials.fetch(inboxId);
  return data;
};

const inboxProfileSocialsQueryConfig = (inboxId: InboxId | undefined) => ({
  queryKey: profileSocialsQueryKey(inboxId!),
  queryFn: () => fetchInboxProfileSocials(inboxId!),
  enabled: !!inboxId,
  // Store for 30 days
  gcTime: 1000 * 60 * 60 * 24 * 30,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: false,
  // We really just want a 24 hour cache here
  // And automatic retries if there was an error fetching
  refetchOnMount: false,
  staleTime: 1000 * 60 * 60 * 24,
  initialDataUpdatedAt: 0,
  persister: profileSocialsPersister,
});

export const useInboxProfileSocialsQuery = (inboxId: InboxId | undefined) => {
  return useQuery(inboxProfileSocialsQueryConfig(inboxId));
};

export const useInboxProfileSocialsQueries = (inboxIds: InboxId[]) => {
  return useQueries({
    queries: inboxIds.map((inboxId) => inboxProfileSocialsQueryConfig(inboxId)),
  });
};

export const fetchInboxProfileSocialsQuery = (inboxId: InboxId) => {
  return queryClient.fetchQuery(inboxProfileSocialsQueryConfig(inboxId));
};

export const setInboxProfileSocialsQueryData = (
  account: string,
  inboxId: InboxId,
  data: IProfileSocials,
  updatedAt?: number
) => {
  return queryClient.setQueryData(
    inboxProfileSocialsQueryConfig(inboxId).queryKey,
    data,
    {
      updatedAt,
    }
  );
};

export const getInboxProfileSocialsQueryData = (
  inboxId: InboxId
): IProfileSocials[] | null => {
  return (
    queryClient.getQueryData(
      inboxProfileSocialsQueryConfig(inboxId).queryKey
    ) ?? null
  );
};

export const invalidateInboxProfileSocialsQuery = (inboxId: InboxId) => {
  queryClient.invalidateQueries({
    queryKey: inboxProfileSocialsQueryConfig(inboxId).queryKey,
  });
};
