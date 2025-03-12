/**
 * Maybe need to move this file somewhere else? Not sure which specific feature it belongs to.
 */
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { InboxId } from "@xmtp/react-native-sdk"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { getEthAddressesFromInboxIds } from "./eth-addresses-from-xmtp-inbox-id"

type IArgs = {
  clientInboxId: InboxId
  inboxId: InboxId | undefined
}

type IStrictArgs = {
  clientInboxId: InboxId
  inboxId: InboxId
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
