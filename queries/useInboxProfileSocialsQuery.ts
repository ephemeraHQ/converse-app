import { getProfileSocialsQueryKey } from "@/queries/QueryKeys";
import { Optional } from "@/types/general";
import {
  UseQueryOptions,
  queryOptions as reactQueryOptions,
  useQuery,
} from "@tanstack/react-query";
import { InboxId } from "@xmtp/react-native-sdk";
import { queryClient } from "./queryClient";

type IArgs = {
  inboxId: InboxId;
};

type IArgsWithCaller = IArgs & {
  caller: string;
};

export const getInboxProfileSocialsQueryConfig = ({
  inboxId,
  caller,
}: Optional<IArgsWithCaller, "caller">) => {
  return reactQueryOptions({
    queryKey: getProfileSocialsQueryKey({ inboxId }),
    // todo: idk do this soon consolidate
    // queryFn: () => getInboxProfileSocials({ inboxId }),
    // persister: reactQueryPersister,
    gcTime: 1000 * 60 * 60 * 24 * 30, // 30 days because this doesn't often change
    ...queryOptions,
    meta: {
      ...queryOptions.meta,
      caller,
    },
    enabled: !!inboxId && (queryOptions.enabled ?? true),
  });
};

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

export function refetchInboxProfileSocialsQuery({ inboxId }: IArgs) {
  queryClient.invalidateQueries({
    queryKey: getInboxProfileSocialsQueryConfig({ inboxId }).queryKey,
  });
}

export const ensureInboxProfileSocialsQueryData = ({
  inboxId,
  caller,
  queryOptions,
}: IArgsWithCallerAndQueryOptions) => {
  return queryClient.ensureQueryData(
    getInboxProfileSocialsQueryConfig({ inboxId, caller, queryOptions })
  );
};
