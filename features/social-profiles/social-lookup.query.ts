import { queryOptions, skipToken, useQuery } from "@tanstack/react-query";
import { fetchSocialProfilesForAddress } from "./social-lookup.api";
import { utils as ethersUtils } from "ethers";
import { DateUtils } from "@/utils/time.utils";
import { reactQueryPersister } from "@/utils/mmkv";
import { queryClient } from "@/queries/queryClient";
import { logger } from "@/utils/logger";

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
          // logger.debug(
          //   `[getSocialProfilesQueryOptions] Executing query function for address: ${address}`
          // );
          // // Validate and format the address
          // if (!ethersUtils.isAddress(address!)) {
          //   logger.error(
          //     `[getSocialProfilesQueryOptions] Invalid Ethereum address: ${address}`
          //   );
          //   throw new Error("Invalid Ethereum address");
          // }

          // const checksummedAddress = ethersUtils.getAddress(address!);
          // logger.debug(
          //   `[getSocialProfilesQueryOptions] Fetching social profiles for checksummed address: ${checksummedAddress}`
          // );
          return fetchSocialProfilesForAddress(address!);
        }
      : skipToken,
    // staleTime: DateUtils.minutes.toMilliseconds(60),
    // persister: reactQueryPersister,
    staleTime: 0,
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
  await queryClient.invalidateQueries(getSocialProfilesQueryOptions(address));
  return queryClient.ensureQueryData(getSocialProfilesQueryOptions(address));
};
