import { queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { getInboxIdFromEthAddress } from "@/features/xmtp/xmtp-inbox-id/xmtp-inbox-id-from-eth-address"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { IEthereumAddress } from "@/utils/evm/address"
import { reactQueryClient } from "@/utils/react-query/react-query.client"

type IArgs = {
  clientInboxId: IXmtpInboxId | undefined
  targetEthAddress: IEthereumAddress | undefined
}

type IStrictArgs = {
  clientInboxId: IXmtpInboxId
  targetEthAddress: IEthereumAddress
}

export function getXmtpInboxIdFromEthAddressQueryOptions(args: IArgs) {
  const { clientInboxId, targetEthAddress } = args

  return queryOptions({
    queryKey: ["xmtp-inbox-id-from-eth-address", clientInboxId, targetEthAddress],
    queryFn:
      clientInboxId && targetEthAddress
        ? () => {
            return getInboxIdFromEthAddress({
              clientInboxId,
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
export function ensureXmtpInboxIdFromEthAddressQueryData(args: IArgs) {
  return reactQueryClient.ensureQueryData(getXmtpInboxIdFromEthAddressQueryOptions(args))
}
