import { queryOptions, useQuery } from "@tanstack/react-query";
import { ConversationTopic, InboxId } from "@xmtp/react-native-sdk";
import { getSafeCurrentSender } from "@/features/authentication/multi-inbox.store";
import { isConversationGroup } from "@/features/conversation/utils/is-conversation-group";
import { doesSocialProfilesMatchTextQuery } from "@/features/profiles/utils/does-social-profiles-match-text-query";
import { ensureSocialProfilesQueryData } from "@/features/social-profiles/social-lookup.query";
import { getAllowedConsentConversationsQueryData } from "@/queries/conversations-allowed-consent-query";
import { getSearchExistingGroupsByMemberNameQueryKey } from "@/queries/QueryKeys";
import { ensureGroupMembersQueryData } from "@/queries/useGroupMembersQuery";
import { captureError } from "@/utils/capture-error";
import { normalizeString } from "@/utils/str";

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
          (id) => id !== searcherInboxId,
        );

        // Use Promise.race to get the first matching member
        const result = await Promise.race([
          ...otherMembersInboxIds.map(async (inboxId) => {
            const socialProfiles = await ensureSocialProfilesQueryData({
              ethAddress: inboxId,
            });

            if (!socialProfiles) return false;

            return doesSocialProfilesMatchTextQuery({
              socialProfiles,
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
    }),
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
