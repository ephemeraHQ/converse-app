import { queryClient } from "@/queries/queryClient";
import { useQuery } from "@tanstack/react-query";
import { getInboxId } from "@/utils/xmtpRN/signIn";

export type IGetInboxIdQueryData = Awaited<ReturnType<typeof getInboxId>>;

export type IGetInboxIdQueryOptions = {
  queryKey: ["inboxId", string];
  queryFn: () => Promise<IGetInboxIdQueryData>;
  enabled: boolean;
};

export function getInboxIdQueryOptions(args: {
  account: string;
}): IGetInboxIdQueryOptions {
  const { account } = args;
  return {
    queryKey: ["inboxId", account],
    queryFn: () => getInboxId(account),
    enabled: !!account,
  };
}

export function useInboxIdQuery(args: { account: string }) {
  const { account } = args;
  return useQuery(getInboxIdQueryOptions({ account }));
}

export function getInboxIdFromQueryData(args: { account: string }) {
  const { account } = args;
  return queryClient.getQueryData<IGetInboxIdQueryData>(
    getInboxIdQueryOptions({ account }).queryKey
  );
}

export function prefetchInboxIdQuery(args: { account: string }) {
  const { account } = args;
  return queryClient.prefetchQuery(getInboxIdQueryOptions({ account }));
}
