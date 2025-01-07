import { IProfileSocials } from "@/features/profiles/profile-types";
import { QueryKey, useQueries, useQuery } from "@tanstack/react-query";
import { getProfilesForAddresses, getProfilesForInboxIds } from "@utils/api";
import {
  create,
  windowedFiniteBatchScheduler,
  indexedResolver,
} from "@yornaath/batshit";

import { queryClient } from "./queryClient";
import mmkv from "@/utils/mmkv";
import { useCurrentInboxId } from "@/data/store/accountsStore";

type ProfileSocialsData = IProfileSocials | null | undefined;

const profileSocialsQueryKey = ({
  currentInboxId,
  profileLookupInboxId,
}: {
  currentInboxId: string | undefined;
  profileLookupInboxId: string | undefined;
}): QueryKey => [
  "profileSocials",
  currentInboxId?.toLowerCase(),
  // Typesafe because there's a lot of account! usage
  profileLookupInboxId?.toLowerCase(),
];

export const profileSocialsQueryStorageKey = ({
  currentInboxId,
  profileLookupInboxId,
}: {
  currentInboxId: string | undefined;
  profileLookupInboxId: string | undefined;
}) =>
  profileSocialsQueryKey({ currentInboxId, profileLookupInboxId }).join("-");

const profileSocials = create({
  fetcher: async (inboxIds: string[]) => {
    // const d = await getProfilesForAddresses([]);
    /*todo: fix this api request*/ const data = await getProfilesForInboxIds({
      inboxIds,
    });
    return data;
  },
  resolver: indexedResolver(),
  scheduler: windowedFiniteBatchScheduler({
    windowMs: 10,
    maxBatchSize: 150,
  }),
});

const fetchProfileSocials = async ({
  currentInboxId,
  profileLookupInboxId,
}: {
  currentInboxId: string;
  profileLookupInboxId: string;
}): Promise<IProfileSocials | null> => {
  const data = await profileSocials.fetch(profileLookupInboxId);

  const key = profileSocialsQueryStorageKey({
    currentInboxId,
    profileLookupInboxId,
  });

  mmkv.delete(key);

  if (data) {
    mmkv.set(key, JSON.stringify(data));
  }

  return data;
};

const profileSocialsQueryConfig = ({
  currentInboxId,
  profileLookupInboxId,
}: {
  currentInboxId: string | undefined;
  profileLookupInboxId: string | undefined;
}) => ({
  queryKey: profileSocialsQueryKey({ currentInboxId, profileLookupInboxId }),
  queryFn: () =>
    // We know that accountInboxId and peerAccountInboxId are defined
    // because of the enabled: !!accountInboxId below
    fetchProfileSocials({
      currentInboxId: currentInboxId!,
      profileLookupInboxId: profileLookupInboxId!,
    }),
  enabled: !!currentInboxId,
  // Store for 30 days
  gcTime: 1000 * 60 * 60 * 24 * 30,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: false,
  // We really just want a 24 hour cache here
  // And automatic retries if there was an error fetching
  refetchOnMount: false,
  staleTime: 1000 * 60 * 60 * 24,
  initialData: (): ProfileSocialsData => {
    // todo(lustig) this is not how we should persist with react query;
    // we should use the perister and map our data to be persistable
    if (
      mmkv.contains(
        profileSocialsQueryStorageKey({ currentInboxId, profileLookupInboxId })
      )
    ) {
      const data = JSON.parse(
        mmkv.getString(
          profileSocialsQueryStorageKey({
            currentInboxId,
            profileLookupInboxId,
          })
        )!
      ) as ProfileSocialsData;
      return data;
    }
  },
  initialDataUpdatedAt: 0,
  // persister: reactQueryPersister,
});

/**
 * Hook to fetch social profile data for a given inbox ID.
 *
 * If no profileLookupInboxId is provided but currentInboxId
 * exists, it will fetch the current user's own profile.
 * Uses react-query for caching and automatic background
 * updates.
 *
 * @param {string} [currentInboxId] - Current user's inbox ID
 * @param {string} [profileLookupInboxId] - Target inbox ID
 *   to lookup
 * @returns {UseQueryResult} Query result with profile data
 *
 * @example
 * // Fetch another user's profile
 * const { data } = useProfileSocialsQuery({
 *   currentInboxId: "user123",
 *   profileLookupInboxId: "user456"
 * });
 *
 * @example
 * // Fetch current user's own profile
 * const { data } = useProfileSocialsQuery({
 *   currentInboxId: "user123"
 * });
 */
export const useProfileSocialsQuery = ({
  profileLookupInboxId,
}: {
  profileLookupInboxId: string | undefined;
}) => {
  const currentInboxId = useCurrentInboxId();
  if (!profileLookupInboxId && currentInboxId) {
    profileLookupInboxId = currentInboxId;
  }
  return useQuery(
    profileSocialsQueryConfig({ currentInboxId, profileLookupInboxId })
  );
};

export const useProfileSocialsQueries = ({
  currentInboxId,
  peerInboxIds,
}: {
  currentInboxId: string;
  peerInboxIds: string[];
}) => {
  return useQueries({
    queries: peerInboxIds.map((peerInboxId) =>
      profileSocialsQueryConfig({
        currentInboxId,
        profileLookupInboxId: peerInboxId,
      })
    ),
  });
};

export const fetchProfileSocialsQuery = ({
  currentInboxId,
  profileLookupInboxId,
}: {
  currentInboxId: string;
  profileLookupInboxId: string;
}) => {
  return queryClient.fetchQuery<IProfileSocials | null>(
    profileSocialsQueryConfig({
      currentInboxId,
      profileLookupInboxId,
    })
  );
};

export const setProfileSocialsQueryData = ({
  currentInboxId,
  profileLookupInboxId,
  data,
  updatedAt,
}: {
  currentInboxId: string;
  profileLookupInboxId: string;
  data: IProfileSocials;
  updatedAt?: number;
}) => {
  return queryClient.setQueryData<ProfileSocialsData>(
    profileSocialsQueryKey({ currentInboxId, profileLookupInboxId }),
    data,
    {
      updatedAt,
    }
  );
};

export const setProfileRecordSocialsQueryData = ({
  currentInboxId,
  record,
}: {
  currentInboxId: string;
  record: Record<string, IProfileSocials>;
}) => {
  Object.keys(record).forEach((profileLookupInboxId) => {
    setProfileSocialsQueryData({
      currentInboxId,
      profileLookupInboxId,
      data: record[profileLookupInboxId],
    });
  });
};

export const getProfileSocialsQueryData = ({
  currentInboxId,
  profileLookupInboxId,
}: {
  currentInboxId: string;
  profileLookupInboxId: string;
}) => {
  return queryClient.getQueryData<ProfileSocialsData>(
    profileSocialsQueryConfig({ currentInboxId, profileLookupInboxId }).queryKey
  );
};

export const invalidateProfileSocialsQuery = ({
  profileLookupInboxId,
}: {
  profileLookupInboxId: string;
}) => {
  const currentInboxId = useCurrentInboxId();
  if (!currentInboxId) {
    return;
  }
  queryClient.invalidateQueries({
    queryKey: profileSocialsQueryKey({ currentInboxId, profileLookupInboxId }),
  });
};
