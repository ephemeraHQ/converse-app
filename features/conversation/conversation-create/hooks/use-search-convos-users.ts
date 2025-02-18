import {
  ISearchProfilesResult,
  searchProfiles,
} from "@/features/profiles/profiles.search.api";
import { getSearchConvosUsersQueryKey } from "@/queries/QueryKeys";
import { DateUtils } from "@/utils/time.utils";
import { isSameInboxId } from "@/utils/xmtpRN/xmtp-inbox-id/xmtp-inbox-id";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { InboxId } from "@xmtp/react-native-sdk";

const isInboxIdIncludedInList =
  (inboxIdsToCheck: string[]) => (profile: ISearchProfilesResult) => {
    return inboxIdsToCheck.some((inboxIdToCheck) =>
      isSameInboxId(profile.xmtpId, inboxIdToCheck)
    );
  };

export function useSearchConvosUsers(args: {
  searchQuery: string;
  inboxIdsToOmit: InboxId[];
}) {
  const { searchQuery, inboxIdsToOmit } = args;

  const shouldInboxIdBeOmitted = isInboxIdIncludedInList(inboxIdsToOmit);

  return useQuery({
    ...getConvosUsersSearchQueryOptions(searchQuery),
    select: (data: ISearchProfilesResult[]) => {
      // Filter out search results for addresses that should be omitted
      // (e.g. current user and users selected users)
      const filteredResults: ISearchProfilesResult[] = data?.filter(
        shouldInboxIdBeOmitted
      );

      return filteredResults;
    },
  });
}

function getConvosUsersSearchQueryOptions(searchQuery: string) {
  const enabled = !!searchQuery && searchQuery.trim().length > 0;
  return queryOptions({
    enabled,
    queryKey: getSearchConvosUsersQueryKey(searchQuery),
    queryFn: enabled ? () => searchProfiles({ searchQuery }) : skipToken,
    staleTime: DateUtils.minutes.toMilliseconds(1),
  });
}
