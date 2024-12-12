import { ProfileSocials } from "@data/store/profilesStore";
import { useQueries, useQuery } from "@tanstack/react-query";
import { getProfilesForAddresses } from "@utils/api";
import {
  create,
  windowedFiniteBatchScheduler,
  indexedResolver,
} from "@yornaath/batshit";

import { queryClient } from "./queryClient";
import { reactQueryPersister } from "@/utils/mmkv";

type ProfileSocialsData = ProfileSocials | null | undefined;

const profileSocialsQueryKey = (account: string, peerAddress: string) => [
  "profileSocials",
  account?.toLowerCase(),
  peerAddress,
];

const profileSocials = create({
  fetcher: async (addresses: string[]) => {
    const data = await getProfilesForAddresses(addresses);
    return data;
  },
  resolver: indexedResolver(),
  scheduler: windowedFiniteBatchScheduler({
    windowMs: 10,
    maxBatchSize: 150,
  }),
});

const fetchProfileSocials = async (peerAddress: string) => {
  const data = await profileSocials.fetch(peerAddress);
  return data;
};

const profileSocialsQueryConfig = (account: string, peerAddress: string) => ({
  queryKey: profileSocialsQueryKey(account, peerAddress),
  queryFn: () => fetchProfileSocials(peerAddress),
  enabled: !!account,
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

export const useProfileSocialsQuery = (
  account: string,
  peerAddress: string
) => {
  return useQuery(profileSocialsQueryConfig(account, peerAddress));
};

export const useProfileSocialsQueries = (
  account: string,
  peerAddresses: string[]
) => {
  return useQueries({
    queries: peerAddresses.map((peerAddress) =>
      profileSocialsQueryConfig(account, peerAddress)
    ),
  });
};

export const fetchProfileSocialsQuery = (
  account: string,
  peerAddress: string
) => {
  return queryClient.fetchQuery<ProfileSocialsData>(
    profileSocialsQueryConfig(account, peerAddress)
  );
};

export const setProfileSocialsQueryData = (
  account: string,
  peerAddress: string,
  data: ProfileSocials,
  updatedAt?: number
) => {
  return queryClient.setQueryData<ProfileSocialsData>(
    profileSocialsQueryKey(account, peerAddress),
    data,
    {
      updatedAt,
    }
  );
};

export const getProfileSocialsQueryData = (
  account: string,
  peerAddress: string
) => {
  return queryClient.getQueryData<ProfileSocialsData>(
    profileSocialsQueryConfig(account, peerAddress).queryKey
  );
};
