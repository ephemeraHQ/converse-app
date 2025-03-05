import { queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { InboxId } from "@xmtp/react-native-sdk"
import { getRecoveryAddressesForInboxIds } from "@/features/xmtp/xmtp-inbox-id/get-recovery-address-for-inbox-ids"
import { queryClient } from "@/queries/queryClient"
import { IEthereumAddress } from "@/utils/evm/address"

type IArgs = {
  clientEthAddress: IEthereumAddress | undefined
  inboxIds: InboxId[] | undefined
}

type IStrictArgs = {
  clientEthAddress: IEthereumAddress
  inboxIds: InboxId[]
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
  await queryClient.invalidateQueries(getRecoveryAddressesForInboxIdsQueryOptions(args))
}
