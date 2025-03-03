import { queryOptions, skipToken, useQueries, useQuery } from "@tanstack/react-query"
import { queryClient } from "@/queries/queryClient"
import { IEthereumAddress, isEthereumAddress } from "@/utils/evm/address"
import { fetchSocialProfilesForAddress } from "./social-profiles.api"

type IArgs = {
  ethAddress: IEthereumAddress | undefined
}

type IStrictArgs = {
  ethAddress: IEthereumAddress
}

const getSocialProfilesForAddressQueryOptions = (args: IArgs) => {
  const { ethAddress } = args
  return queryOptions({
    queryKey: ["social-profiles-for-eth-address", ethAddress ?? ""],
    queryFn:
      ethAddress && isEthereumAddress(ethAddress)
        ? () => {
            return fetchSocialProfilesForAddress({
              ethAddress,
            })
          }
        : skipToken,
    staleTime: 0,
  })
}

export const useSocialProfilesForAddressQuery = (args: IArgs) => {
  return useQuery(getSocialProfilesForAddressQueryOptions(args))
}

export function useSocialProfilesForEthAddressQueries(args: { ethAddresses: IEthereumAddress[] }) {
  const { ethAddresses } = args
  return useQueries({
    queries: ethAddresses.map((ethAddress) =>
      getSocialProfilesForAddressQueryOptions({ ethAddress }),
    ),
    combine: (results) => ({
      data: results.map((result) => result.data),
      isLoading: results.some((result) => result.isLoading),
      isError: results.some((result) => result.isError),
      error: results.find((result) => result.error)?.error,
    }),
  })
}

export const ensureSocialProfilesForAddressQuery = async (args: IStrictArgs) => {
  return queryClient.ensureQueryData(getSocialProfilesForAddressQueryOptions(args))
}

export async function ensureSocialProfilesForAddressesQuery(args: {
  ethAddresses: IEthereumAddress[]
}) {
  return (
    await Promise.all(
      args.ethAddresses.map((ethAddress) =>
        queryClient.fetchQuery(getSocialProfilesForAddressQueryOptions({ ethAddress })),
      ),
    )
  ).flat()
}

export function prefetchSocialProfilesForAddress(args: { ethAddress: IEthereumAddress }) {
  return queryClient.prefetchQuery(getSocialProfilesForAddressQueryOptions(args))
}
