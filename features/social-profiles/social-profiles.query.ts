import { IEthereumAddress, isEthereumAddress } from "@/utils/evm/address"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { queryOptions, skipToken, useQueries, useQuery } from "@tanstack/react-query"
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
    staleTime: 30 * 24 * 60 * 60 * 1000, // 30 days, it's very rare that we need to refetch this
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
  return reactQueryClient.ensureQueryData(getSocialProfilesForAddressQueryOptions(args))
}

export async function ensureSocialProfilesForAddressesQuery(args: {
  ethAddresses: IEthereumAddress[]
}) {
  return (
    await Promise.all(
      args.ethAddresses.map((ethAddress) =>
        reactQueryClient.fetchQuery(getSocialProfilesForAddressQueryOptions({ ethAddress })),
      ),
    )
  ).flat()
}

export function prefetchSocialProfilesForAddress(args: { ethAddress: IEthereumAddress }) {
  return reactQueryClient.prefetchQuery(getSocialProfilesForAddressQueryOptions(args))
}

export function getSocialProfilesForEthAddressQueryData(args: IStrictArgs) {
  return reactQueryClient.getQueryData(getSocialProfilesForAddressQueryOptions(args).queryKey)
}
