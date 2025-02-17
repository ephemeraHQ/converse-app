import {
  queryOptions,
  skipToken,
  useQuery,
  useQueries,
} from "@tanstack/react-query";
import { queryClient } from "../../queries/queryClient";
import { reactQueryPersister } from "@/utils/mmkv";
import { getProfile, IProfile } from "@/features/profiles/profiles.api";
import { DateUtils } from "@/utils/time.utils";

const profileQueryKey = (xmtpId: string) => ["profile", xmtpId] as const;

const profileQueryConfig = (xmtpId: string | undefined) => {
  const enabled = !!xmtpId;
  return queryOptions({
    enabled,
    queryKey: profileQueryKey(xmtpId!),
    queryFn: enabled ? () => getProfile(xmtpId!) : skipToken,
    gcTime: DateUtils.days.toMilliseconds(30),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: DateUtils.days.toMilliseconds(1),
    persister: reactQueryPersister,
  });
};

export const useProfileQuery = (xmtpId: string | undefined) => {
  return useQuery(profileQueryConfig(xmtpId));
};

export const prefetchProfileQuery = (xmtpId: string) => {
  return queryClient.prefetchQuery(profileQueryConfig(xmtpId));
};

export const fetchProfileQuery = (xmtpId: string) => {
  return queryClient.fetchQuery(profileQueryConfig(xmtpId));
};

export const setProfileQueryData = (
  xmtpId: string,
  data: Partial<Omit<IProfile, "updatedAt" | "createdAt">>,
  updatedAt?: number
) => {
  return queryClient.setQueryData<Partial<IProfile>>(profileQueryKey(xmtpId), {
    ...data,
    updatedAt: updatedAt ? updatedAt.toString() : Date.now().toString(),
  });
};

export const getProfileQueryData = (xmtpId: string) => {
  return queryClient.getQueryData(profileQueryConfig(xmtpId).queryKey);
};

export const ensureProfileQueryData = (xmtpId: string) => {
  return queryClient.ensureQueryData(profileQueryConfig(xmtpId));
};

export const invalidateProfileQuery = (xmtpId: string) => {
  queryClient.invalidateQueries({
    queryKey: profileQueryKey(xmtpId),
  });
};

export const useProfilesQueries = (inboxIds: string[] | undefined) => {
  return useQueries({
    queries: (inboxIds ?? []).map((inboxIid) => profileQueryConfig(inboxIid)),
    combine: (results) => ({
      data: results.map((result) => result.data),
      isLoading: results.some((result) => result.isLoading),
      isError: results.some((result) => result.isError),
      error: results.find((result) => result.error)?.error,
    }),
  });
};
