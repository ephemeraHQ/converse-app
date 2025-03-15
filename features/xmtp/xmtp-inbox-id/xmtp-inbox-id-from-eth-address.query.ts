import { queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { getInboxIdFromEthAddress } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id-from-eth-address"
import { IEthereumAddress } from "@/utils/evm/address"
import { reactQueryClient } from "@/utils/react-query/react-query.client"

type IArgs = {
  clientEthAddress: IEthereumAddress | undefined
  targetEthAddress: IEthereumAddress | undefined
}

type IStrictArgs = {
  clientEthAddress: IEthereumAddress
  targetEthAddress: IEthereumAddress
}

export function getXmtpInboxIdFromEthAddressQueryOptions(args: IArgs) {
  const { clientEthAddress, targetEthAddress } = args

  return queryOptions({
    queryKey: ["xmtp-inbox-id-from-eth-address", clientEthAddress, targetEthAddress],
    queryFn:
      clientEthAddress && targetEthAddress
        ? () => {
            return getInboxIdFromEthAddress({
              clientEthAddress,
              targetEthAddress,
            })
          }
        : skipToken,
  })
}

export function useXmtpInboxIdFromEthAddressQuery(args: IArgs) {
  return useQuery(getXmtpInboxIdFromEthAddressQueryOptions(args))
}

export async function invalidateXmtpInboxIdFromEthAddressQuery(args: IStrictArgs) {
  await reactQueryClient.invalidateQueries(getXmtpInboxIdFromEthAddressQueryOptions(args))
}

export function getXmtpInboxIdFromEthAddressQueryData(args: IArgs) {
  return reactQueryClient.getQueryData(getXmtpInboxIdFromEthAddressQueryOptions(args).queryKey)
}
