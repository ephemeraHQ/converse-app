import { getCurrentAccount } from "@/data/store/accountsStore";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { getSearchExistingGroupsByGroupNameQueryKey } from "@/queries/QueryKeys";
import { getAllowedConsentConversationsQueryData } from "@/queries/conversations-allowed-consent-query";
import { normalizeString } from "@/utils/str";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { InboxId } from "@xmtp/react-native-sdk";

export async function searchExistingGroupsByGroupName(args: {
  searchQuery: string;
}) {
  const { searchQuery } = args;
  const currentAccount = getCurrentAccount()!;
  const conversations = getAllowedConsentConversationsQueryData({
    account: currentAccount,
  });

  if (!conversations || !searchQuery) {
    return [];
  }

  const groups = conversations.filter(isConversationGroup);

  return groups
    .filter((group) => normalizeString(group.name).includes(searchQuery))
    .map((group) => group.topic);
}

export function getSearchExistingGroupsByGroupNameQueryOptions(args: {
  searchQuery: string;
  searcherInboxId: InboxId;
}) {
  const { searchQuery, searcherInboxId } = args;
  const normalizedSearchQuery = normalizeString(searchQuery);
  return queryOptions({
    // False positive
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: getSearchExistingGroupsByGroupNameQueryKey({
      searchQuery: normalizedSearchQuery,
      inboxId: searcherInboxId,
    }),
    queryFn: () => searchExistingGroupsByGroupName(args),
    enabled: !!normalizedSearchQuery && !!searcherInboxId,
    staleTime: 0,
  });
}

export function useSearchExistingGroupsByGroupName(args: {
  searchQuery: string;
  searcherInboxId: InboxId;
}) {
  return useQuery(getSearchExistingGroupsByGroupNameQueryOptions(args));
}
