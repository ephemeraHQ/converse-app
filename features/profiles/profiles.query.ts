import {
  queryOptions,
  skipToken,
  useQuery,
  useQueries,
} from "@tanstack/react-query";
import { queryClient } from "../../queries/queryClient";
import { reactQueryPersister } from "@/utils/mmkv";
import {
  fetchProfile,
  IConvosProfileForInbox,
} from "@/features/profiles/profiles.api";
import { DateUtils } from "@/utils/time.utils";

const profileQueryKey = ({ xmtpId }: { xmtpId: string }) =>
  ["profile", xmtpId] as const;

const profileQueryConfig = ({ xmtpId }: { xmtpId: string | undefined }) => {
  const enabled = !!xmtpId;
  return queryOptions({
    enabled,
    queryKey: profileQueryKey({ xmtpId: xmtpId! }),
    queryFn: enabled ? () => fetchProfile({ xmtpId: xmtpId! }) : skipToken,
    gcTime: DateUtils.days.toMilliseconds(30),
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: DateUtils.days.toMilliseconds(1),
    persister: reactQueryPersister,
  });
};

export const useProfileQuery = ({ xmtpId }: { xmtpId: string | undefined }) => {
  return useQuery(profileQueryConfig({ xmtpId }));
};

export const prefetchProfileQuery = ({ xmtpId }: { xmtpId: string }) => {
  return queryClient.prefetchQuery(profileQueryConfig({ xmtpId }));
};

export const fetchProfileQuery = ({ xmtpId }: { xmtpId: string }) => {
  return queryClient.fetchQuery(profileQueryConfig({ xmtpId }));
};

export type IConvosProfileForInboxUpdate = Partial<
  Omit<IConvosProfileForInbox, "updatedAt" | "createdAt">
>;

export type ISetProfileQueryDataArgs = {
  xmtpId: string;
  data: IConvosProfileForInboxUpdate;
  updatedAt?: number;
};
export const setProfileQueryData = ({
  xmtpId,
  data,
  updatedAt,
}: ISetProfileQueryDataArgs) => {
  return queryClient.setQueryData<Partial<IConvosProfileForInbox>>(
    profileQueryKey({ xmtpId }),
    {
      ...data,
      updatedAt: updatedAt ? updatedAt.toString() : Date.now().toString(),
    }
  );
};

export const getProfileQueryData = ({ xmtpId }: { xmtpId: string }) => {
  return queryClient.getQueryData(profileQueryConfig({ xmtpId }).queryKey);
};

export const ensureProfileQueryData = ({ xmtpId }: { xmtpId: string }) => {
  return queryClient.ensureQueryData(profileQueryConfig({ xmtpId }));
};

export const invalidateProfileQuery = ({ xmtpId }: { xmtpId: string }) => {
  queryClient.invalidateQueries({
    queryKey: profileQueryKey({ xmtpId }),
  });
};

export const useProfilesQueries = ({
  xmtpInboxIds,
}: {
  xmtpInboxIds: string[] | undefined;
}) => {
  return useQueries({
    queries: (xmtpInboxIds ?? []).map((xmtpInboxId) =>
      profileQueryConfig({ xmtpId: xmtpInboxId })
    ),
    combine: (results) => ({
      data: results.map((result) => result.data),
      isLoading: results.some((result) => result.isLoading),
      isError: results.some((result) => result.isError),
      error: results.find((result) => result.error)?.error,
    }),
  });
};
