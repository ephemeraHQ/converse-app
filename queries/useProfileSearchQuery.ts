import {
  QueryKey,
  queryOptions,
  skipToken,
  useQuery,
} from "@tanstack/react-query";
import { queryClient } from "./queryClient";

const profileSearchQueryKey = (query: string): QueryKey => [
  "profileSearch",
  query,
];

const profileSearchQueryConfig = (query: string | undefined) => {
  const enabled = !!query && query.trim().length > 0;
  return queryOptions({
    enabled,
    queryKey: profileSearchQueryKey(query!),
    queryFn: enabled ? () => searchProfiles(query!) : skipToken,
    // Only cache for 5 minutes since search results can change frequently
    gcTime: 1000 * 60 * 5,
    staleTime: 1000 * 60 * 5,
  });
};

export const useProfileSearchQuery = (query: string | undefined) => {
  return useQuery(profileSearchQueryConfig(query));
};

export const prefetchProfileSearchQuery = (query: string) => {
  return queryClient.prefetchQuery(profileSearchQueryConfig(query));
};

export const fetchProfileSearchQuery = (query: string) => {
  return queryClient.fetchQuery<ISearchProfilesResult[]>(
    profileSearchQueryConfig(query)
  );
};

export const invalidateProfileSearchQuery = (query: string) => {
  queryClient.invalidateQueries({
    queryKey: profileSearchQueryKey(query),
  });
};
