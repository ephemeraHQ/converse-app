import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { getRecoveryAddressesForInboxIds } from "@/features/xmtp/xmtp-inbox-id/get-recovery-address-for-inbox-ids"
import { IEthereumAddress } from "@/utils/evm/address"
import { reactQueryClient } from "@/utils/react-query/react-query.client"

type IArgs = {
  clientEthAddress: IEthereumAddress | undefined
  inboxIds: IXmtpInboxId[] | undefined
}

type IStrictArgs = {
  clientEthAddress: IEthereumAddress
  inboxIds: IXmtpInboxId[]
}

export function getRecoveryAddressesForInboxIdsQueryOptions(args: IArgs) {
  const { clientEthAddress, inboxIds } = args

  return queryOptions({
    queryKey: ["recovery-addresses-for-inbox-ids", clientEthAddress, inboxIds],
    queryFn:
      clientEthAddress && inboxIds?.length
        ? () => {
            return getRecoveryAddressesForInboxIds({
              clientEthAddress,
              inboxIds,
            })
          }
        : skipToken,
  })
}

export function useRecoveryAddressesForInboxIdsQuery(args: IArgs) {
  return useQuery(getRecoveryAddressesForInboxIdsQueryOptions(args))
}

export async function invalidateRecoveryAddressesForInboxIdsQuery(args: IStrictArgs) {
  await reactQueryClient.invalidateQueries(getRecoveryAddressesForInboxIdsQueryOptions(args))
}
