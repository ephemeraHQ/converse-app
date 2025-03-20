import { queryOptions, skipToken } from "@tanstack/react-query"
import { syncAllXmtpConversations } from "@/features/xmtp/xmtp-sync/xmtp-sync"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { getReactQueryKey } from "@/utils/react-query/react-query.utils"

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

          // return syncConversationsBatcher.fetch({
          //   clientInboxId: clientInboxId,
          //   // consentStates: consentStates,
          // })
        }
      : skipToken,
    staleTime: 10000, // 10 seconds because we want to do this often to make sure the data we have is up to date
  })
}

export function ensureConversationSyncAllQuery(args: IArgs) {
  return reactQueryClient.ensureQueryData(getConversationSyncAllQueryOptions(args))
}

export async function refetchConversationSyncAllQuery(args: IArgs) {
  return reactQueryClient.invalidateQueries({
    queryKey: getConversationSyncAllQueryOptions(args).queryKey,
  })
}
