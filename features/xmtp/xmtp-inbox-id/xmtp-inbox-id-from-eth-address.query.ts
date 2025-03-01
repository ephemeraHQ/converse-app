import { queryOptions, useQuery } from "@tanstack/react-query"
import { getInboxIdFromEthAddress } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id-from-eth-address"
import { queryClient } from "@/queries/queryClient"
import { IEthereumAddress } from "@/utils/evm/address"

export function getXmtpInboxIdFromEthAddressQueryOptions(args: {
  clientEthAddress: IEthereumAddress
  targetEthAddress: IEthereumAddress
}) {
  const { clientEthAddress, targetEthAddress } = args

  return queryOptions({
    queryKey: [
      "xmtp-inbox-id-from-eth-address",
      clientEthAddress,
      targetEthAddress,
    ],
    queryFn: () => {
      return getInboxIdFromEthAddress({
        clientEthAddress,
        targetEthAddress,
      })
    },
  })
}

export function useXmtpInboxIdFromEthAddressQuery(args: {
  clientEthAddress: IEthereumAddress
  targetEthAddress: IEthereumAddress
}) {
  return useQuery(getXmtpInboxIdFromEthAddressQueryOptions(args))
}

export async function invalidateXmtpInboxIdFromEthAddressQuery(args: {
  clientEthAddress: IEthereumAddress
  targetEthAddress: IEthereumAddress
}) {
  await queryClient.invalidateQueries(
    getXmtpInboxIdFromEthAddressQueryOptions(args),
  )
}
