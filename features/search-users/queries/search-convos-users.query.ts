import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { keepPreviousData, queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { ISearchProfilesResult, searchProfiles } from "@/features/profiles/profiles.search.api"
import { isSameInboxId } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id.utils"
import { DateUtils } from "@/utils/time.utils"

export function useSearchConvosUsersQuery(args: {
  searchQuery: string
  inboxIdsToOmit: IXmtpInboxId[]
}) {
  const { searchQuery, inboxIdsToOmit } = args

  return useQuery({
    ...getConvosUsersSearchQueryOptions(searchQuery),
    select: (data: ISearchProfilesResult[]) => {
      // Filter out search results for inboxIds that should be omitted
      return data.filter(
        (profile) =>
          !inboxIdsToOmit.some((inboxIdToOmit) => isSameInboxId(profile.xmtpId, inboxIdToOmit)),
      )
    },
  })
}

function getConvosUsersSearchQueryOptions(searchQuery: string) {
  const enabled = !!searchQuery && searchQuery.trim().length > 0
  return queryOptions({
    enabled,
    queryKey: ["search-convos-users", searchQuery],
    queryFn: enabled ? () => searchProfiles({ searchQuery }) : skipToken,
    staleTime: DateUtils.minutes(5).toMilliseconds(),
    // Keep showing previous search results while new results load
    // to prevent UI flicker during search
    placeholderData: keepPreviousData,
  })
}
