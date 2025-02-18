import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { fetchSocialProfilesForAddress } from "./social-lookup.api";
import { utils as ethersUtils } from "ethers";
import { DateUtils } from "@/utils/time.utils";
import { reactQueryPersister } from "@/utils/mmkv";
import { queryClient } from "@/queries/queryClient";

const socialProfilesQueryKey = (address: string) =>
  ["socialProfiles", address] as const;

export type UseSocialProfilesForAddressArgs = {
  address?: string;
};

const getSocialProfilesQueryOptions = (address: string | undefined) => {
  const enabled = Boolean(address);
  return queryOptions({
    enabled,
    queryKey: socialProfilesQueryKey(address!),
    queryFn: enabled
      ? () => {
          // Validate and format the address
          if (!ethersUtils.isAddress(address!)) {
            throw new Error("Invalid Ethereum address");
          }

          const checksummedAddress = ethersUtils.getAddress(address!);
          return fetchSocialProfilesForAddress(checksummedAddress);
        }
      : skipToken,
    staleTime: DateUtils.minutes.toMilliseconds(60),
    persister: reactQueryPersister,
  });
};

export const useSocialProfilesForAddress = ({
  address,
}: UseSocialProfilesForAddressArgs) => {
  return useQuery(getSocialProfilesQueryOptions(address));
};

export const getSocialProfilesQueryData = (address: string | undefined) => {
  return queryClient.getQueryData(
    getSocialProfilesQueryOptions(address).queryKey
  );
};

export const ensureSocialProfilesQueryData = async (address: string) => {
  return queryClient.ensureQueryData(getSocialProfilesQueryOptions(address));
};
