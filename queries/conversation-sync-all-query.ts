import { queryOptions, skipToken } from "@tanstack/react-query"
import { ConsentState } from "@xmtp/react-native-sdk"
import { getXmtpClientByEthAddress } from "@/features/xmtp/xmtp-client/xmtp-client.service"
import { conversationSyncAllQueryKey } from "@/queries/QueryKeys"
import { captureError } from "@/utils/capture-error"
import { reactQueryClient } from "@/utils/react-query/react-query-client"

type IArgs = {
  ethAddress: string
  consentStates: ConsentState[]
}

export function getConversationSyncAllQueryOptions(args: IArgs) {
  const enabled = !!args.ethAddress
  return queryOptions({
    enabled,
    queryKey: conversationSyncAllQueryKey(args),
    queryFn: enabled
      ? async () => {
          if (!args.ethAddress) {
            throw new Error("ethAddress is required")
          }

          if (!args.consentStates.length) {
            throw new Error("consentStates is required")
          }

          const client = await getXmtpClientByEthAddress({
            ethAddress: args.ethAddress,
          })

          const beforeSync = new Date().getTime()
          await client.conversations.syncAllConversations(args.consentStates)
          const afterSync = new Date().getTime()

          const timeDiff = afterSync - beforeSync
          if (timeDiff > 3000) {
            captureError(
              new Error(
                `[getConversationSyncAllQuery] Syncing conversations from network took ${timeDiff}ms for account ${args.ethAddress}`,
              ),
            )
          }

          return true
        }
      : skipToken,
    staleTime: 5000, // 5 seconds seems okay for now to not overload the network
  })
}

export function ensureConversationSyncAllQuery(args: IArgs) {
  return reactQueryClient.ensureQueryData(getConversationSyncAllQueryOptions(args))
}
