import { IProfileSocials } from "@/features/profiles/profile-types";
import {
  QueryKey,
  queryOptions,
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import { getProfilesForAddresses } from "@/utils/api/profiles";
import {
  create,
  windowedFiniteBatchScheduler,
  indexedResolver,
} from "@yornaath/batshit";

import { queryClient } from "./queryClient";
import mmkv from "@/utils/mmkv";

type ProfileSocialsData = IProfileSocials | null | undefined;

const profileSocialsQueryKey = (peerAddress: string): QueryKey => [
  "profileSocials",
  // Typesafe because there's a lot of account! usage
  peerAddress?.toLowerCase(),
];

export const profileSocialsQueryStorageKey = (peerAddress: string) =>
  profileSocialsQueryKey(peerAddress).join("-");

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

  const key = profileSocialsQueryStorageKey(peerAddress);

  mmkv.delete(key);

  if (data) {
    mmkv.set(key, JSON.stringify(data));
  }

  return data;
};

const profileSocialsQueryConfig = (peerAddress: string) =>
  queryOptions({
    queryKey: profileSocialsQueryKey(peerAddress),
    queryFn: () => fetchProfileSocials(peerAddress),
    // Store for 30 days
    gcTime: 1000 * 60 * 60 * 24 * 30,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    // We really just want a 24 hour cache here
    // And automatic retries if there was an error fetching
    refetchOnMount: false,
    staleTime: 1000 * 60 * 60 * 24,
    initialData: (): ProfileSocialsData => {
      if (mmkv.contains(profileSocialsQueryStorageKey(peerAddress))) {
        const data = JSON.parse(
          mmkv.getString(profileSocialsQueryStorageKey(peerAddress))!
        ) as ProfileSocialsData;
        return data;
      }
    },
    initialDataUpdatedAt: 0,
    // persister: reactQueryPersister,
  });

export const useProfileSocialsQuery = (peerAddress: string) => {
  return useQuery(profileSocialsQueryConfig(peerAddress));
};

export const useProfileSocialsQueries = (peerAddresses: string[]) => {
  return useQueries({
    queries: peerAddresses.map((peerAddress) =>
      profileSocialsQueryConfig(peerAddress)
    ),
  });
};

export const prefetchProfileSocialsQuery = (
  account: string,
  peerAddress: string
) => {
  return queryClient.prefetchQuery(profileSocialsQueryConfig(peerAddress));
};

export const fetchProfileSocialsQuery = (
  account: string,
  peerAddress: string
) => {
  return queryClient.fetchQuery<IProfileSocials | null>(
    profileSocialsQueryConfig(peerAddress)
  );
};

export const setProfileSocialsQueryData = (
  peerAddress: string,
  data: IProfileSocials,
  updatedAt?: number
) => {
  return queryClient.setQueryData<ProfileSocialsData>(
    profileSocialsQueryKey(peerAddress),
    data,
    {
      updatedAt,
    }
  );
};

export const setProfileRecordSocialsQueryData = (
  record: Record<string, IProfileSocials>
) => {
  Object.keys(record).forEach((peerAddress) => {
    setProfileSocialsQueryData(peerAddress, record[peerAddress]);
  });
};

export const getProfileSocialsQueryData = (peerAddress: string) => {
  return queryClient.getQueryData(
    profileSocialsQueryConfig(peerAddress).queryKey
  );
};

export const ensureProfileSocialsQueryData = (peerAddress: string) => {
  return queryClient.ensureQueryData(profileSocialsQueryConfig(peerAddress));
};

export const invalidateProfileSocialsQuery = (address: string) => {
  queryClient.invalidateQueries({
    queryKey: profileSocialsQueryKey(address),
  });
};
