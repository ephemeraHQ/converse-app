import {
  QueryKey,
  queryOptions,
  skipToken,
  useQuery,
} from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import {
  ISearchProfilesResult,
  searchProfiles,
} from "@/features/profiles/profiles.api";
import { DateUtils } from "@/utils/time.utils";

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
    gcTime: DateUtils.minutes.toMilliseconds(5),
    staleTime: DateUtils.minutes.toMilliseconds(5),
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
