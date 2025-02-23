import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/queries/queryClient";
import { fetchSocialProfilesForAddress } from "./social-profiles.api";

type IArgs = {
  ethAddress: string | undefined;
};

type IStrictArgs = {
  ethAddress: string;
};

const getSocialProfilesQueryOptions = (args: IArgs) => {
  const { ethAddress } = args;
  return queryOptions({
    queryKey: ["social-profiles", ethAddress ?? ""],
    queryFn: ethAddress
      ? () => {
          return fetchSocialProfilesForAddress({
            ethAddress,
          });
        }
      : skipToken,
    staleTime: 0,
  });
};

// React hook can accept undefined
export const useSocialProfilesForAddressQuery = (args: IArgs) => {
  return useQuery(getSocialProfilesQueryOptions(args));
};

export const ensureSocialProfilesQueryData = async (args: IStrictArgs) => {
  return queryClient.ensureQueryData(
    getSocialProfilesQueryOptions({ ...args }),
  );
};
