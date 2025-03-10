import { QueryKey, queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { ISearchProfilesResult, searchProfiles } from "@/features/profiles/profiles.search.api"
import { DateUtils } from "@/utils/time.utils"
import { reactQueryClient } from "../../utils/react-query/react-query.client"

const profileSearchQueryKey = (args: { query: string }): QueryKey => ["profileSearch", args.query]

const profileSearchQueryConfig = (args: { query?: string }) => {
  const enabled = !!args.query && args.query.trim().length > 0
  return queryOptions({
    enabled,
    queryKey: profileSearchQueryKey({ query: args.query! }),
    queryFn: enabled ? () => searchProfiles({ searchQuery: args.query! }) : skipToken,
    gcTime: DateUtils.minutes(5).toMilliseconds(),
    staleTime: DateUtils.minutes(5).toMilliseconds(),
  })
}

export const useProfileSearchQuery = (args: { query?: string }) => {
  return useQuery(profileSearchQueryConfig(args))
}

export const prefetchProfileSearchQuery = (args: { query: string }) => {
  return reactQueryClient.prefetchQuery(profileSearchQueryConfig(args))
}

export const fetchProfileSearchQuery = (args: { query: string }) => {
  return reactQueryClient.fetchQuery<ISearchProfilesResult[]>(profileSearchQueryConfig(args))
}

export const invalidateProfileSearchQuery = (args: { query: string }) => {
  reactQueryClient.invalidateQueries({
    queryKey: profileSearchQueryKey(args),
  })
}
