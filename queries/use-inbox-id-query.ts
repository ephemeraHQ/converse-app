import { queryClient } from "@/queries/queryClient";
import { useQuery } from "@tanstack/react-query";
import { getInboxIdFromCryptocurrencyAddress } from "@/utils/xmtpRN/signIn";
import { InboxId } from "@xmtp/react-native-sdk";

export type IGetInboxIdQueryData = Awaited<
  ReturnType<typeof getInboxIdFromCryptocurrencyAddress>
>;

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
    queryFn: () => getInboxIdFromCryptocurrencyAddress(account),
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

export function prefetchInboxIdQuery(args: { inboxId: InboxId }) {
  const { inboxId } = args;
  return queryClient.prefetchQuery(getInboxIdQueryOptions({ inboxId }));
}
