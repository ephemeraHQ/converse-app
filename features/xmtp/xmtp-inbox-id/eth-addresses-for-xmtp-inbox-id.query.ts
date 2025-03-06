/**
 * Maybe need to move this file somewhere else? Not sure which specific feature it belongs to.
 */
import { queryOptions, skipToken, useQuery } from "@tanstack/react-query"
import { InboxId } from "@xmtp/react-native-sdk"
import { IEthereumAddress } from "@/utils/evm/address"
import { reactQueryClient } from "@/utils/react-query/react-query-client"
import { getEthAddressesFromInboxIds } from "./eth-addresses-from-xmtp-inbox-id"

type IArgs = {
  clientEthAddress: string
  inboxId: InboxId | undefined
}

type IStrictArgs = {
  clientEthAddress: IEthereumAddress
  inboxId: InboxId
}

export function getEthAddressesForXmtpInboxIdQueryOptions(args: IArgs) {
  const { clientEthAddress, inboxId } = args

  return queryOptions({
    queryKey: ["eth-addresses-for-xmtp-inbox-id", clientEthAddress, inboxId],
    queryFn:
      clientEthAddress && inboxId
        ? () => {
            return getEthAddressesFromInboxIds({
              clientEthAddress,
              inboxIds: [inboxId],
            })
          }
        : skipToken,
  })
}

export function useEthAddressesForXmtpInboxId(args: IArgs) {
  const { clientEthAddress, inboxId } = args

  return useQuery(
    getEthAddressesForXmtpInboxIdQueryOptions({
      clientEthAddress,
      inboxId,
    }),
  )
}

export function ensureEthAddressForXmtpInboxId(args: IStrictArgs) {
  const { clientEthAddress, inboxId } = args
  return reactQueryClient.ensureQueryData(
    getEthAddressesForXmtpInboxIdQueryOptions({
      clientEthAddress,
      inboxId,
    }),
  )
}

export function invalidateEthAddressesForXmtpInboxId(args: IStrictArgs) {
  const { clientEthAddress, inboxId } = args
  return reactQueryClient.invalidateQueries(
    getEthAddressesForXmtpInboxIdQueryOptions({
      clientEthAddress,
      inboxId,
    }),
  )
}
