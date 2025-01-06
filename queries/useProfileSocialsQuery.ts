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

type ProfileSocialsData = IProfileSocials | null | undefined;

const profileSocialsQueryKey = ({
  accountInboxId,
  peerAccountInboxId,
}: {
  accountInboxId: string | undefined;
  peerAccountInboxId: string | undefined;
}): QueryKey => [
  "profileSocials",
  accountInboxId?.toLowerCase(),
  // Typesafe because there's a lot of account! usage
  peerAccountInboxId?.toLowerCase(),
];

export const profileSocialsQueryStorageKey = ({
  accountInboxId,
  peerAccountInboxId,
}: {
  accountInboxId: string | undefined;
  peerAccountInboxId: string | undefined;
}) => profileSocialsQueryKey({ accountInboxId, peerAccountInboxId }).join("-");

const profileSocials = create({
  fetcher: async (inboxIds: string[]) => {
    const d = await getProfilesForAddresses([]);
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
  accountInboxId,
  peerAccountInboxId,
}: {
  accountInboxId: string;
  peerAccountInboxId: string;
}): Promise<IProfileSocials | null> => {
  const data = await profileSocials.fetch(peerAccountInboxId);

  const key = profileSocialsQueryStorageKey({
    accountInboxId,
    peerAccountInboxId,
  });

  mmkv.delete(key);

  if (data) {
    mmkv.set(key, JSON.stringify(data));
  }

  return data;
};

const profileSocialsQueryConfig = ({
  accountInboxId,
  peerAccountInboxId,
}: {
  accountInboxId: string | undefined;
  peerAccountInboxId: string | undefined;
}) => ({
  queryKey: profileSocialsQueryKey({ accountInboxId, peerAccountInboxId }),
  queryFn: () =>
    // We know that accountInboxId and peerAccountInboxId are defined
    // because of the enabled: !!accountInboxId below
    fetchProfileSocials({
      accountInboxId: accountInboxId!,
      peerAccountInboxId: peerAccountInboxId!,
    }),
  enabled: !!accountInboxId,
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
        profileSocialsQueryStorageKey({ accountInboxId, peerAccountInboxId })
      )
    ) {
      const data = JSON.parse(
        mmkv.getString(
          profileSocialsQueryStorageKey({ accountInboxId, peerAccountInboxId })
        )!
      ) as ProfileSocialsData;
      return data;
    }
  },
  initialDataUpdatedAt: 0,
  // persister: reactQueryPersister,
});

export const useProfileSocialsQuery = ({
  accountInboxId,
  peerAccountInboxId,
}: {
  accountInboxId: string | undefined;
  peerAccountInboxId: string | undefined;
}) => {
  if (!peerAccountInboxId && accountInboxId) {
    peerAccountInboxId = accountInboxId;
  }
  return useQuery(
    profileSocialsQueryConfig({ accountInboxId, peerAccountInboxId })
  );
};

export const useProfileSocialsQueries = ({
  accountInboxId,
  peerAccountInboxIds,
}: {
  accountInboxId: string;
  peerAccountInboxIds: string[];
}) => {
  return useQueries({
    queries: peerAccountInboxIds.map((peerAccountInboxId) =>
      profileSocialsQueryConfig({
        accountInboxId,
        peerAccountInboxId,
      })
    ),
  });
};

// export const prefetchProfileSocialsQuery = (
//   accountInboxId: string,
//   peerAccountInboxIds: string[]
// ) => {
//   return queryClient.prefetchQuery(
//     profileSocialsQueryConfig({ accountInboxId, peerAccountInboxIds })
//   );
// };

export const fetchProfileSocialsQuery = (
  accountInboxId: string,
  peerAccountInboxId: string
) => {
  return queryClient.fetchQuery<IProfileSocials | null>(
    profileSocialsQueryConfig({
      accountInboxId,
      peerAccountInboxId,
    })
  );
};

export const setProfileSocialsQueryData = ({
  accountInboxId,
  peerAccountInboxId,
  data,
  updatedAt,
}: {
  accountInboxId: string;
  peerAccountInboxId: string;
  data: IProfileSocials;
  updatedAt?: number;
}) => {
  return queryClient.setQueryData<ProfileSocialsData>(
    profileSocialsQueryKey({ accountInboxId, peerAccountInboxId }),
    data,
    {
      updatedAt,
    }
  );
};

export const setProfileRecordSocialsQueryData = ({
  accountInboxId,
  record,
}: {
  accountInboxId: string;
  record: Record<string, IProfileSocials>;
}) => {
  Object.keys(record).forEach((peerAccountInboxId) => {
    setProfileSocialsQueryData({
      accountInboxId,
      peerAccountInboxId,
      data: record[peerAccountInboxId],
    });
  });
};

export const getProfileSocialsQueryData = ({
  accountInboxId,
  peerAccountInboxId,
}: {
  accountInboxId: string;
  peerAccountInboxId: string;
}) => {
  return queryClient.getQueryData<ProfileSocialsData>(
    profileSocialsQueryConfig({ accountInboxId, peerAccountInboxId }).queryKey
  );
};

export const invalidateProfileSocialsQuery = (
  accountInboxId: string,
  peerAccountInboxId: string
) => {
  queryClient.invalidateQueries({
    queryKey: profileSocialsQueryKey({ accountInboxId, peerAccountInboxId }),
  });
};
