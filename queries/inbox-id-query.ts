import { queryClient } from "@/queries/queryClient";
import { getInboxId } from "@/utils/xmtpRN/signIn";
import { useQuery } from "@tanstack/react-query";

export type IGetInboxIdQueryData = Awaited<ReturnType<typeof getInboxId>>;

export type IGetInboxIdQueryOptions = {
  queryKey: ["inboxId", string];
  queryFn: () => Promise<IGetInboxIdQueryData>;
  enabled: boolean;
};

export function getInboxIdQueryOptions(args: {
  account: string;
}): IGetInboxIdQueryOptions {
  return {
    queryKey: ["inboxId", args.account],
    queryFn: () => getInboxId(args.account),
    enabled: !!args.account,
  };
}

export function useInboxIdQuery(args: { account: string }) {
  return useQuery(getInboxIdQueryOptions(args));
}

export function getInboxIdFromQueryData(args: { account: string }) {
  return queryClient.getQueryData<IGetInboxIdQueryData>(
    getInboxIdQueryOptions(args).queryKey
  );
}

export function prefetchInboxIdQuery(args: { account: string }) {
  return queryClient.prefetchQuery(getInboxIdQueryOptions(args));
}

export function ensureInboxId(args: { account: string }) {
  return queryClient.ensureQueryData(getInboxIdQueryOptions(args));
}
