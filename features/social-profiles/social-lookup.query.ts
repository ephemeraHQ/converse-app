import { queryClient } from "@/queries/queryClient";
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { fetchSocialProfilesForAddress } from "./social-lookup.api";

const socialProfilesQueryKey = (args: { ethAddress: string }) =>
  ["socialProfiles", args.ethAddress] as const;

type IArgs = {
  ethAddress: string | undefined;
};

const getSocialProfilesQueryOptions = (args: IArgs) => {
  const enabled = Boolean(args.ethAddress);
  return queryOptions({
    enabled,
    queryKey: socialProfilesQueryKey({ ethAddress: args.ethAddress! }),
    queryFn: enabled
      ? () => {
          return fetchSocialProfilesForAddress(address!);
        }
      : skipToken,
    // staleTime: DateUtils.minutes.toMilliseconds(60),
    // persister: reactQueryPersister,
    staleTime: 0,
  });
};

export const useSocialProfilesForAddressQuery = (args: IArgs) => {
  return useQuery(getSocialProfilesQueryOptions(args));
};

export const getSocialProfilesQueryData = (args: IArgs) => {
  return queryClient.getQueryData(getSocialProfilesQueryOptions(args).queryKey);
};

export const ensureSocialProfilesQueryData = async (args: IArgs) => {
  return queryClient.ensureQueryData(getSocialProfilesQueryOptions(args));
};
