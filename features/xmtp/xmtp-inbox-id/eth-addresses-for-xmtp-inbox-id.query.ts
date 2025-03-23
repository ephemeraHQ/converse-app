/**
 * Maybe need to move this file somewhere else? Not sure which specific feature it belongs to.
 */
import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { getReactQueryKey } from "@/utils/react-query/react-query.utils"
import { getEthAddressesFromInboxIds } from "./eth-addresses-from-xmtp-inbox-id"

type IArgs = {
  clientInboxId: IXmtpInboxId
  inboxId: IXmtpInboxId | undefined
}

type IStrictArgs = {
  clientInboxId: IXmtpInboxId
  inboxId: IXmtpInboxId
}

export function getEthAddressesForXmtpInboxIdQueryOptions(args: IArgs) {
  const { clientInboxId, inboxId } = args

  return queryOptions({
    queryKey: getReactQueryKey({
      baseStr: "eth-addresses-for-xmtp-inbox-id",
      clientInboxId,
      inboxId,
    }),
    queryFn:
      clientInboxId && inboxId
        ? () => {
            return getEthAddressesFromInboxIds({
              clientInboxId,
              inboxIds: [inboxId],
            })
          }
        : skipToken,
  })
}

export function useEthAddressesForXmtpInboxIdQuery(args: IArgs) {
  return useQuery(getEthAddressesForXmtpInboxIdQueryOptions(args))
}

export function ensureEthAddressesForXmtpInboxIdQueryData(args: IStrictArgs) {
  return reactQueryClient.ensureQueryData(getEthAddressesForXmtpInboxIdQueryOptions(args))
}

export function invalidateEthAddressesForXmtpInboxIdQuery(args: IStrictArgs) {
  return reactQueryClient.invalidateQueries(getEthAddressesForXmtpInboxIdQueryOptions(args))
}
export function getEthAddressesForXmtpInboxIdQueryData(args: IStrictArgs) {
  return reactQueryClient.getQueryData(getEthAddressesForXmtpInboxIdQueryOptions(args).queryKey)
}
