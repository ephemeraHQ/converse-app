import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../queries/queryClient";
import { reactQueryPersister } from "@/utils/mmkv";
import { getProfile, IProfile } from "@/features/profiles/profiles.api";
import { DateUtils } from "@/utils/time.utils";

const profileQueryKey = (profileId: string) => ["profile", profileId] as const;

const profileQueryConfig = (profileId: string | undefined) => {
  const enabled = !!profileId;
  return queryOptions({
    enabled,
    queryKey: profileQueryKey(profileId!),
    queryFn: enabled ? () => getProfile(profileId!) : skipToken,
    gcTime: DateUtils.days.toMillis(30),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: DateUtils.days.toMillis(1),
    persister: reactQueryPersister,
  });
};

export const useProfileQuery = (profileId: string | undefined) => {
  return useQuery(profileQueryConfig(profileId));
};

export const prefetchProfileQuery = (profileId: string) => {
  return queryClient.prefetchQuery(profileQueryConfig(profileId));
};

export const fetchProfileQuery = (profileId: string) => {
  return queryClient.fetchQuery(profileQueryConfig(profileId));
};

export const setProfileQueryData = (
  profileId: string,
  data: Partial<Omit<IProfile, "updatedAt" | "createdAt">>,
  updatedAt?: number
) => {
  return queryClient.setQueryData<Partial<IProfile>>(
    profileQueryKey(profileId),
    {
      ...data,
      updatedAt: updatedAt ? updatedAt.toString() : Date.now().toString(),
    }
  );
};

export const getProfileQueryData = (profileId: string) => {
  return queryClient.getQueryData(profileQueryConfig(profileId).queryKey);
};

export const ensureProfileQueryData = (profileId: string) => {
  return queryClient.ensureQueryData(profileQueryConfig(profileId));
};

export const invalidateProfileQuery = (profileId: string) => {
  queryClient.invalidateQueries({
    queryKey: profileQueryKey(profileId),
  });
};
