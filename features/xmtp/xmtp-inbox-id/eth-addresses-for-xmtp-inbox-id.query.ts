/**
 * Maybe need to move this file somewhere else? Not sure which specific feature it belongs to.
 */
import { IXmtpInboxId } from "@features/xmtp/xmtp.types"
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
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
    queryKey: ["eth-addresses-for-xmtp-inbox-id", clientInboxId, inboxId],
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

export function useEthAddressesForXmtpInboxId(args: IArgs) {
  const { clientInboxId, inboxId } = args

  return useQuery(
    getEthAddressesForXmtpInboxIdQueryOptions({
      clientInboxId,
      inboxId,
    }),
  )
}

export function ensureEthAddressForXmtpInboxId(args: IStrictArgs) {
  const { clientInboxId, inboxId } = args
  return reactQueryClient.ensureQueryData(
    getEthAddressesForXmtpInboxIdQueryOptions({
      clientInboxId,
      inboxId,
    }),
  )
}

export function invalidateEthAddressesForXmtpInboxId(args: IStrictArgs) {
  const { clientInboxId, inboxId } = args
  return reactQueryClient.invalidateQueries(
    getEthAddressesForXmtpInboxIdQueryOptions({
      clientInboxId,
      inboxId,
    }),
  )
}
