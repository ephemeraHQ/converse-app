import { doesSocialsMatchTextQuery } from "@/features/profiles/utils/does-socials-match-text-query";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { getSearchExistingGroupsByMemberNameQueryKey } from "@/queries/QueryKeys";
import { getAllowedConsentConversationsQueryData } from "@/queries/conversations-allowed-consent-query";
import { ensureGroupMembersQueryData } from "@/queries/useGroupMembersQuery";
import { ensureInboxProfileSocialsQueryData } from "@/queries/useInboxProfileSocialsQuery";
import { captureError } from "@/utils/capture-error";
import { normalizeString } from "@/utils/str";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";
import { getSafeCurrentSender } from "@/features/multi-inbox/multi-inbox.store";

export async function searchExistingGroupsByGroupMembers(args: {
  searchQuery: string;
  searcherInboxId: InboxId;
}) {
  const { searchQuery, searcherInboxId } = args;

  const currentAccount = getSafeCurrentSender().ethereumAddress;

  const conversations = getAllowedConsentConversationsQueryData({
    account: currentAccount,
  });

  if (!conversations || !searchQuery) {
    return [];
  }

  const matchingTopics: ConversationTopic[] = [];

  await Promise.all(
    conversations.filter(isConversationGroup).map(async (group) => {
      try {
        const members = await ensureGroupMembersQueryData({
          caller: "searchExistingGroupsByGroupMembers",
          account: currentAccount,
          topic: group.topic,
        });

        const otherMembersInboxIds = members.ids.filter(
          (id) => id !== searcherInboxId
        );

        // Use Promise.race to get the first matching member
        const result = await Promise.race([
          ...otherMembersInboxIds.map(async (inboxId) => {
            const socials = await ensureInboxProfileSocialsQueryData({
              inboxId,
              caller: "searchExistingGroupsByGroupMembers",
            });

            if (!socials) return false;

            return doesSocialsMatchTextQuery({
              socials,
              normalizedQuery: searchQuery,
            });
          }),
        ]);

        if (result) {
          matchingTopics.push(group.topic);
        }
      } catch (error) {
        captureError(error);
      }
    })
  );

  return matchingTopics;
}

export function getSearchExistingGroupsByGroupMembersQueryOptions(args: {
  searchQuery: string;
  searcherInboxId: InboxId;
}) {
  const { searchQuery, searcherInboxId } = args;
  const normalizedSearchQuery = normalizeString(searchQuery);
  return queryOptions({
    // False positive
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: getSearchExistingGroupsByMemberNameQueryKey({
      searchQuery: normalizedSearchQuery,
      inboxId: searcherInboxId,
    }),
    queryFn: () => searchExistingGroupsByGroupMembers(args),
    enabled: !!normalizedSearchQuery && !!searcherInboxId,
    staleTime: 0,
  });
}

export function useSearchExistingGroupsByGroupMembers(args: {
  searchQuery: string;
  searcherInboxId: InboxId;
}) {
  return useQuery(getSearchExistingGroupsByGroupMembersQueryOptions(args));
}
