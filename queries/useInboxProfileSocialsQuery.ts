import { IProfileSocials } from "@/features/profiles/profile-types";
import { QueryKey, useQueries, useQuery } from "@tanstack/react-query";
import { getProfilesForInboxIds } from "@utils/api";
import {
  create,
  windowedFiniteBatchScheduler,
  indexedResolver,
} from "@yornaath/batshit";

import { queryClient } from "./queryClient";
import { InboxId } from "@xmtp/react-native-sdk";
import mmkv from "@/utils/mmkv";
import { useCurrentInboxId } from "@/data/store/accountsStore";

const profileSocialsQueryKey = ({
  currentInboxId,
  profileLookupInboxId,
}: {
  currentInboxId: string;
  profileLookupInboxId: string;
}): QueryKey => [
  "inboxProfileSocials",
  currentInboxId?.toLowerCase(),
  profileLookupInboxId?.toLowerCase(),
];

export const inboxProfileSocialsQueryStorageKey = ({
  currentInboxId,
  profileLookupInboxId,
}: {
  currentInboxId: string;
  profileLookupInboxId: string;
}) =>
  profileSocialsQueryKey({ currentInboxId, profileLookupInboxId }).join("-");

const profileSocials = create({
  fetcher: async (inboxIds: string[]) => {
    const data = await getProfilesForInboxIds({ inboxIds });
    return data;
  },
  resolver: indexedResolver(),
  scheduler: windowedFiniteBatchScheduler({
    windowMs: 10,
    maxBatchSize: 150,
  }),
});

const fetchInboxProfileSocials = async ({
  currentInboxId,
  profileLookupInboxId,
}: {
  currentInboxId: string;
  profileLookupInboxId: string;
}): Promise<IProfileSocials | null> => {
  const data = await profileSocials.fetch(profileLookupInboxId);

  const key = inboxProfileSocialsQueryStorageKey({
    currentInboxId,
    profileLookupInboxId,
  });

  mmkv.delete(key);

  if (data) {
    mmkv.set(key, JSON.stringify(data));
  }

  return data;
};

const inboxProfileSocialsQueryConfig = ({
  currentInboxId,
  profileLookupInboxId,
}: {
  currentInboxId: string | undefined;
  profileLookupInboxId: string;
}) => ({
  queryKey: profileSocialsQueryKey({
    currentInboxId: currentInboxId!,
    profileLookupInboxId,
  }),
  queryFn: () =>
    fetchInboxProfileSocials({
      currentInboxId: currentInboxId!,
      profileLookupInboxId,
    }),
  enabled: !!currentInboxId && !!profileLookupInboxId,
  // Store for 30 days
  gcTime: 1000 * 60 * 60 * 24 * 30,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: false,
  // We really just want a 24 hour cache here
  // And automatic retries if there was an error fetching
  refetchOnMount: false,
  staleTime: 1000 * 60 * 60 * 24,
  initialData: (): IProfileSocials[] | null | undefined => {
    if (!currentInboxId || !profileLookupInboxId) {
      return undefined;
    }
    if (
      mmkv.contains(
        inboxProfileSocialsQueryStorageKey({
          currentInboxId,
          profileLookupInboxId,
        })
      )
    ) {
      const data = JSON.parse(
        mmkv.getString(
          inboxProfileSocialsQueryStorageKey({
            currentInboxId,
            profileLookupInboxId,
          })
        )!
      ) as IProfileSocials[];
      return data;
    }
  },
  initialDataUpdatedAt: 0,
});

export const useSocialProfileQueryByInboxId = (
  profileLookupInboxId: string
) => {
  const currentInboxId = useCurrentInboxId()!;
  return useQuery(
    // todo(lustig) more of this socials typing issues
    // @ts-expect-error
    inboxProfileSocialsQueryConfig({
      currentInboxId,
      profileLookupInboxId,
    })
  );
};

// note(lustig) i want to rename this something like
// inboxDiscoverability rather than inboxProfileSocials
export const useInboxProfileSocialsQueries = ({
  currentInboxId,
  profileLookupInboxIds,
}: {
  currentInboxId: string | undefined;
  profileLookupInboxIds: string[];
}) => {
  return useQueries({
    queries: profileLookupInboxIds.map((profileLookupInboxId) =>
      inboxProfileSocialsQueryConfig({
        currentInboxId,
        profileLookupInboxId,
      })
    ),
  });
};

export const fetchInboxProfileSocialsQuery = ({
  currentInboxId,
  profileLookupInboxId,
}: {
  currentInboxId: string;
  profileLookupInboxId: string;
}) => {
  return queryClient.fetchQuery(
    inboxProfileSocialsQueryConfig({
      currentInboxId,
      profileLookupInboxId,
    })
  );
};

export const setInboxProfileSocialsQueryData = (
  account: string,
  inboxId: InboxId,
  data: IProfileSocials,
  updatedAt?: number
) => {
  return queryClient.setQueryData(
    inboxProfileSocialsQueryConfig({
      currentInboxId: account,
      profileLookupInboxId: inboxId,
    }).queryKey,
    data,
    {
      updatedAt,
    }
  );
};

export const getInboxProfileSocialsQueryData = ({
  currentInboxId,
  profileLookupInboxId,
}: {
  currentInboxId: string;
  profileLookupInboxId: string;
}): IProfileSocials[] | null => {
  return (
    queryClient.getQueryData(
      inboxProfileSocialsQueryConfig({
        currentInboxId,
        profileLookupInboxId,
      }).queryKey
    ) ?? null
  );
};

export const invalidateInboxProfileSocialsQuery = ({
  currentInboxId,
  profileLookupInboxId,
}: {
  currentInboxId: string;
  profileLookupInboxId: string;
}) => {
  queryClient.invalidateQueries({
    queryKey: inboxProfileSocialsQueryConfig({
      currentInboxId,
      profileLookupInboxId,
    }).queryKey,
  });
};
