import { IProfileSocials } from "@/features/profiles/profile-types";
import { profileSocialsQueryKey } from "@/queries/QueryKeys";
import { getProfilesForInboxIds } from "@/utils/api/profiles";
import { reactQueryPersister } from "@/utils/mmkv";
import { queryOptions, useQueries, useQuery } from "@tanstack/react-query";
import { InboxId } from "@xmtp/react-native-sdk";
import {
  create,
  indexedResolver,
  windowedFiniteBatchScheduler,
} from "@yornaath/batshit";
import { queryClient } from "./queryClient";

type IArgs = {
  inboxId: InboxId;
};

const inboxProfileSocialsBatchFetcher = create({
  fetcher: async (inboxIds: InboxId[]) => {
    return getProfilesForInboxIds({ inboxIds });
  },
  resolver: indexedResolver(),
  scheduler: windowedFiniteBatchScheduler({
    windowMs: 10,
    maxBatchSize: 150,
  }),
});

const fetchInboxProfileSocials = async ({
  inboxId,
}: IArgs): Promise<IProfileSocials[] | null> => {
  return inboxProfileSocialsBatchFetcher.fetch(inboxId);
};

export const getInboxProfileSocialsQueryConfig = ({ inboxId }: IArgs) =>
  queryOptions({
    queryKey: profileSocialsQueryKey({ inboxId }),
    queryFn: () => fetchInboxProfileSocials({ inboxId }),
    enabled: !!inboxId,
    persister: reactQueryPersister,
    initialData: (): IProfileSocials[] | null | undefined => {
      if (!inboxId) {
        return undefined;
      }
    },
    gcTime: 1000 * 60 * 60 * 24 * 30,
  });

export const useInboxProfileSocialsQuery = ({ inboxId }: IArgs) => {
  return useQuery(getInboxProfileSocialsQueryConfig({ inboxId }));
};

export const useInboxProfileSocialsQueries = ({
  inboxIds,
}: {
  inboxIds: InboxId[];
}) => {
  return useQueries({
    queries: inboxIds.map((inboxId) =>
      getInboxProfileSocialsQueryConfig({ inboxId })
    ),
  });
};

export const fetchInboxProfileSocialsQuery = ({ inboxId }: IArgs) => {
  return queryClient.fetchQuery(getInboxProfileSocialsQueryConfig({ inboxId }));
};

export const getInboxProfileSocialsQueryData = ({ inboxId }: IArgs) => {
  return queryClient.getQueryData(
    getInboxProfileSocialsQueryConfig({ inboxId }).queryKey
  );
};

export const invalidateInboxProfileSocialsQuery = ({ inboxId }: IArgs) => {
  queryClient.invalidateQueries({
    queryKey: getInboxProfileSocialsQueryConfig({ inboxId }).queryKey,
  });
};

export const ensureInboxProfileSocialsQueryData = ({ inboxId }: IArgs) => {
  return queryClient.ensureQueryData(
    getInboxProfileSocialsQueryConfig({ inboxId })
  );
};
