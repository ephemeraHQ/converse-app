import { ProfileSocials } from "@data/store/profilesStore";
import { useQueries, useQuery } from "@tanstack/react-query";
import { getProfilesForAddresses } from "@utils/api";
import logger from "@utils/logger";
import {
  create,
  windowedFiniteBatchScheduler,
  indexedResolver,
} from "@yornaath/batshit";

import { profileSocialsQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";

const profileSocials = create({
  fetcher: async (addresses: string[]) => {
    logger.info("Fetching profiles for addresses", addresses);
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
  // Save to mmkv to access it later
  return data;
};

const profileSocialesQueryConfig = (account: string, peerAddress: string) => ({
  queryKey: profileSocialsQueryKey(account, peerAddress),
  queryFn: () => fetchProfileSocials(peerAddress),
  enabled: !!account,
  // Store for 30 days
  gcTime: 1000 * 60 * 60 * 24 * 30,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: false,
  // TODO: Clean this up after development
  // refetchOnMount: false,
  // We really just want a 24 hour cache here
  // And automatic retries if there was an error fetching
  staleTime: 1000, //1000 * 60 * 60 * 24,
});

export const useProfileSocialsQuery = (
  account: string,
  peerAddress: string
) => {
  return useQuery(profileSocialesQueryConfig(account, peerAddress));
};

export const useProfileSocialsQueries = (
  account: string,
  peerAddresses: string[]
) => {
  return useQueries({
    queries: peerAddresses.map((peerAddress) =>
      profileSocialesQueryConfig(account, peerAddress)
    ),
  });
};

export const fetchProfileSocialsQuery = (
  account: string,
  peerAddress: string
) => {
  return queryClient.fetchQuery(
    profileSocialesQueryConfig(account, peerAddress)
  );
};

export const setProfileSocialsQueryData = (
  account: string,
  peerAddress: string,
  data: ProfileSocials,
  updatedAt?: number
) => {
  return queryClient.setQueryData(
    profileSocialsQueryKey(account, peerAddress),
    data,
    {
      updatedAt,
    }
  );
};
