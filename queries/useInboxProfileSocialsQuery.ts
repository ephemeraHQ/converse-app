import { IProfileSocials } from "@/features/profiles/profile-types";
import { getProfilesForInboxIds } from "@/utils/api/profiles";
import {
  QueryKey,
  queryOptions,
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import {
  create,
  indexedResolver,
  windowedFiniteBatchScheduler,
} from "@yornaath/batshit";

import mmkv, { reactQueryPersister } from "@/utils/mmkv";
import { InboxId } from "@xmtp/react-native-sdk";
import { queryClient } from "./queryClient";

const profileSocialsQueryKey = (
  account: string,
  peerAddress: string
): QueryKey => [
  "inboxProfileSocials",
  account?.toLowerCase(),
  peerAddress?.toLowerCase(),
];

export const inboxProfileSocialsQueryStorageKey = (
  account: string,
  inboxId: InboxId
) => profileSocialsQueryKey(account, inboxId).join("-");

const profileSocials = create({
  fetcher: async (inboxIds: InboxId[]) => {
    return getProfilesForInboxIds({ inboxIds });
  },
  resolver: indexedResolver(),
  scheduler: windowedFiniteBatchScheduler({
    windowMs: 10,
    maxBatchSize: 150,
  }),
});

const fetchInboxProfileSocials = async (
  account: string,
  inboxId: InboxId
): Promise<IProfileSocials[] | null> => {
  const data = await profileSocials.fetch(inboxId);
  const key = inboxProfileSocialsQueryStorageKey(account, inboxId);

  // Set in mmkv to use for notifications in Swift
  mmkv.delete(key);
  if (data) {
    mmkv.set(key, JSON.stringify(data));
  }

  return data;
};

const inboxProfileSocialsQueryConfig = (
  account: string,
  inboxId: InboxId | undefined
) =>
  queryOptions({
    queryKey: profileSocialsQueryKey(account, inboxId!),
    queryFn: () => fetchInboxProfileSocials(account, inboxId!),
    enabled: !!account && !!inboxId,
    persister: reactQueryPersister,
    initialData: (): IProfileSocials[] | null | undefined => {
      if (!account || !inboxId) {
        return undefined;
      }
      if (mmkv.contains(inboxProfileSocialsQueryStorageKey(account, inboxId))) {
        const data = JSON.parse(
          mmkv.getString(inboxProfileSocialsQueryStorageKey(account, inboxId))!
        ) as IProfileSocials[];
        return data;
      }
    },
    // 30 days because it doens't change often
    gcTime: 1000 * 60 * 60 * 24 * 30,
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
  data: IProfileSocials,
  updatedAt?: number
) => {
  return queryClient.setQueryData(
    inboxProfileSocialsQueryConfig(account, inboxId).queryKey,
    (oldData) => {
      if (!oldData) return undefined;
      return {
        ...oldData,
        updatedAt,
      };
    },
    { updatedAt }
  );
};

export const getInboxProfileSocialsQueryData = (
  account: string,
  inboxId: InboxId
) => {
  return queryClient.getQueryData(
    inboxProfileSocialsQueryConfig(account, inboxId).queryKey
  );
};

export const invalidateInboxProfileSocialsQuery = (
  account: string,
  inboxId: InboxId
) => {
  queryClient.invalidateQueries({
    queryKey: inboxProfileSocialsQueryConfig(account, inboxId).queryKey,
  });
};

export const ensureInboxProfileSocialsQueryData = (
  account: string,
  inboxId: InboxId
) => {
  return queryClient.ensureQueryData(
    inboxProfileSocialsQueryConfig(account, inboxId)
  );
};
