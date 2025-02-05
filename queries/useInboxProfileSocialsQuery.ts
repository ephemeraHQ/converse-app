import { getProfileSocialsQueryKey } from "@/queries/QueryKeys";
import { getProfilesForInboxIds } from "@/utils/api/profiles";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { InboxId } from "@xmtp/react-native-sdk";
import {
  create,
  indexedResolver,
  windowedFiniteBatchScheduler,
} from "@yornaath/batshit";
import { queryClient } from "./queryClient";
import { Optional } from "@/types/general";

type IArgs = {
  inboxId: InboxId;
};

type IArgsWithCaller = IArgs & {
  caller: string;
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

const fetchInboxProfileSocials = async ({ inboxId }: IArgs) => {
  if (!inboxId) {
    throw new Error("Inbox ID is required");
  }
  return inboxProfileSocialsBatchFetcher.fetch(inboxId);
};

export const getInboxProfileSocialsQueryConfig = ({
  inboxId,
  caller,
}: Optional<IArgsWithCaller, "caller">) =>
  queryOptions({
    queryKey: getProfileSocialsQueryKey({ inboxId }),
    queryFn: () => fetchInboxProfileSocials({ inboxId }),
    enabled: !!inboxId,
    // persister: reactQueryPersister,
    gcTime: 1000 * 60 * 60 * 24 * 30, // 30 days because this doesn't often change
    meta: {
      caller,
    },
  });

export const useInboxProfileSocialsQuery = ({
  inboxId,
  caller,
}: IArgsWithCaller) => {
  return useQuery(getInboxProfileSocialsQueryConfig({ inboxId, caller }));
};

export const fetchInboxProfileSocialsQuery = ({
  inboxId,
  caller,
}: IArgsWithCaller) => {
  return queryClient.fetchQuery(
    getInboxProfileSocialsQueryConfig({ inboxId, caller })
  );
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

export const ensureInboxProfileSocialsQueryData = ({
  inboxId,
  caller,
}: IArgsWithCaller) => {
  return queryClient.ensureQueryData(
    getInboxProfileSocialsQueryConfig({ inboxId, caller })
  );
};
