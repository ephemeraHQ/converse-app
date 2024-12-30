import { IProfileSocials } from "@/features/profiles/profile-types";
import { QueryKey, useQueries, useQuery } from "@tanstack/react-query";
import { getProfilesForAddresses } from "@utils/api";
import {
  create,
  windowedFiniteBatchScheduler,
  indexedResolver,
} from "@yornaath/batshit";

import { queryClient } from "./queryClient";
import mmkv from "@/utils/mmkv";

type ProfileSocialsData = IProfileSocials | null | undefined;

const profileSocialsQueryKey = (
  account: string,
  peerAddress: string
): QueryKey => [
  "profileSocials",
  account?.toLowerCase(),
  // Typesafe because there's a lot of account! usage
  peerAddress?.toLowerCase(),
];

export const profileSocialsQueryStorageKey = (
  account: string,
  peerAddress: string
) => profileSocialsQueryKey(account, peerAddress).join("-");

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

const fetchProfileSocials = async (account: string, peerAddress: string) => {
  const data = await profileSocials.fetch(peerAddress);

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
  initialData: (): ProfileSocialsData => {
    if (mmkv.contains(profileSocialsQueryStorageKey(account, peerAddress))) {
      const data = JSON.parse(
        mmkv.getString(profileSocialsQueryStorageKey(account, peerAddress))!
      ) as ProfileSocialsData;
      return data;
    }
  },
  initialDataUpdatedAt: 0,
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

export const prefetchProfileSocialsQuery = (
  account: string,
  peerAddress: string
) => {
  return queryClient.prefetchQuery(
    profileSocialsQueryConfig(account, peerAddress)
  );
};

export const fetchProfileSocialsQuery = (
  account: string,
  peerAddress: string
) => {
  return queryClient.fetchQuery<IProfileSocials | null>(
    profileSocialsQueryConfig(account, peerAddress)
  );
};

export const setProfileSocialsQueryData = (
  account: string,
  peerAddress: string,
  data: IProfileSocials,
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

export const setProfileRecordSocialsQueryData = (
  account: string,
  record: Record<string, IProfileSocials>
) => {
  Object.keys(record).forEach((peerAddress) => {
    setProfileSocialsQueryData(account, peerAddress, record[peerAddress]);
  });
};

export const getProfileSocialsQueryData = (
  account: string,
  peerAddress: string
) => {
  return queryClient.getQueryData<ProfileSocialsData>(
    profileSocialsQueryConfig(account, peerAddress).queryKey
  );
};

export const invalidateProfileSocialsQuery = (
  account: string,
  address: string
) => {
  queryClient.invalidateQueries({
    queryKey: profileSocialsQueryKey(account, address),
  });
};
