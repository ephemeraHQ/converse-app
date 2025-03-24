import { queryOptions, skipToken } from "@tanstack/react-query"
import { syncAllXmtpConversations } from "@/features/xmtp/xmtp-conversations/xmtp-conversations-sync"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { getReactQueryKey } from "@/utils/react-query/react-query.utils"
import { DateUtils } from "@/utils/time.utils"

type IArgs = {
  clientInboxId: IXmtpInboxId
  // consentStates: IConsentState[] // For now let's always sync everything
}

// const syncConversationsBatcher = create({
//   name: "sync-all-xmtp-conversations",
//   fetcher: async (batchedArgs: IArgs[]) => {
//     if (batchedArgs.length > 0) {
//       await syncAllXmtpConversations(batchedArgs[0])
//     }

//     // Return success for all batched calls
//     return true
//   },
//   scheduler: windowScheduler(200), // 200ms window for batching
//   resolver: (results, args) => {
//     return results
//   },
// })

export function getConversationSyncAllQueryOptions(args: IArgs) {
  const {
    clientInboxId,
    // consentStates
  } = args

  const enabled = !!args.clientInboxId

  return queryOptions({
    enabled,
    queryKey: getReactQueryKey({
      baseStr: "conversation-sync-all",
      clientInboxId: clientInboxId,
      // consentStates: consentStates.join(","),
    }),
    queryFn: clientInboxId
      ? async () => {
          await syncAllXmtpConversations({
            clientInboxId: clientInboxId,
          })

          return true
        }
      : skipToken,
    refetchIntervalInBackground: true,
    refetchInterval: DateUtils.minutes(10).toMilliseconds(), // Sync every 10 minutes
    staleTime: DateUtils.seconds(10).toMilliseconds(), // Consider data stale after 10 seconds
  })
}

export async function refetchConversationSyncAllQuery(args: IArgs) {
  return reactQueryClient.fetchQuery(getConversationSyncAllQueryOptions(args))
}
