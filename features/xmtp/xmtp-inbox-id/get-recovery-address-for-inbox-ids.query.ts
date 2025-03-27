import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { getRecoveryAddressesForInboxIds } from "@/features/xmtp/xmtp-inbox-id/get-recovery-address-for-inbox-ids"
import { reactQueryClient } from "@/utils/react-query/react-query.client"

type IArgs = {
  clientInboxId: IXmtpInboxId | undefined
  inboxIds: IXmtpInboxId[] | undefined
}

type IStrictArgs = {
  clientInboxId: IXmtpInboxId
  inboxIds: IXmtpInboxId[]
}

export function getRecoveryAddressesForInboxIdsQueryOptions(args: IArgs) {
  const { clientInboxId, inboxIds } = args

  return queryOptions({
    queryKey: ["recovery-addresses-for-inbox-ids", clientInboxId, inboxIds],
    queryFn:
      clientInboxId && inboxIds?.length
        ? () => {
            return getRecoveryAddressesForInboxIds({
              clientInboxId,
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
