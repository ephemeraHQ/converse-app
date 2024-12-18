import { ProfileSocials } from "@data/store/profilesStore";
import { useQueries, useQuery } from "@tanstack/react-query";
import { getProfilesForAddresses } from "@utils/api";
import {
  create,
  windowedFiniteBatchScheduler,
  indexedResolver,
} from "@yornaath/batshit";

import { queryClient } from "./queryClient";
import mmkv from "@/utils/mmkv";

type ProfileSocialsData = ProfileSocials | null | undefined;

const profileSocialsQueryKey = (account: string, peerAddress: string) => [
  "profileSocials",
  account?.toLowerCase(),
  peerAddress,
];

const profileSocialsQueryStorageKey = (account: string, peerAddress: string) =>
  profileSocialsQueryKey(account, peerAddress).join("-");

const profileSocials = create<
  { [address: string]: ProfileSocials },
  { account: string; address: string },
  ProfileSocials | null
>({
  fetcher: async (queries) => {
    const account = queries[0].account;
    const addresses = queries.map((q) => q.address);
    const data = await getProfilesForAddresses(account, addresses);
    return data as { [address: string]: ProfileSocials };
  },
  resolver: indexedResolver<
    { [address: string]: ProfileSocials },
    { account: string; address: string }
  >(),
  scheduler: windowedFiniteBatchScheduler({
    windowMs: 10,
    maxBatchSize: 150,
  }),
});

const fetchProfileSocials = async (account: string, peerAddress: string) => {
  const data = await profileSocials.fetch({
    account,
    address: peerAddress,
  });

  const key = profileSocialsQueryStorageKey(account, peerAddress);
  mmkv.delete(key);

  if (data) {
    mmkv.set(key, JSON.stringify(data));
  }

  return data;
};

const profileSocialsQueryConfig = (account: string, peerAddress: string) => ({
  queryKey: profileSocialsQueryKey(account, peerAddress),
  queryFn: () => fetchProfileSocials(account, peerAddress),
  enabled: !!account,
  // Store for 30 days
  gcTime: 1000 * 60 * 60 * 24 * 30,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: false,
  // We really just want a 24 hour cache here
  // And automatic retries if there was an error fetching
  refetchOnMount: false,
  staleTime: 1000 * 60 * 60 * 24,
  // persister: reactQueryPersister,
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
