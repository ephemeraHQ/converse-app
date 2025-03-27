import { config } from "@/config"
import { getXmtpClientByInboxId } from "@/features/xmtp/xmtp-client/xmtp-client"
import { IXmtpConsentState, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"

type IGetXmtpConversationsArgs = {
  clientInboxId: IXmtpInboxId
  consentStates?: IXmtpConsentState[]
  limit?: number
}

/**
 * Gets XMTP conversations, batching identical requests within 100ms.
 */
export async function getXmtpConversations(args: IGetXmtpConversationsArgs) {
  return getXmtpConversationsUnbatched(args)
  // return getXmtpConversationsBatcher.fetch(args)
}

// /**
//  * Creates a unique key to identify identical requests
//  */
// function createCacheKey(args: IGetXmtpConversationsArgs): string {
//   return JSON.stringify({
//     clientInboxId: args.clientInboxId,
//     consentStates: args.consentStates,
//     limit: args.limit,
//   })
// }

// /**
//  * Batcher that deduplicates identical requests within a 100ms window
//  */
// const getXmtpConversationsBatcher = create<
//   IXmtpConversationWithCodecs[],
//   IGetXmtpConversationsArgs
// >({
//   name: "get-xmtp-conversations",
//   fetcher: async (batchedArgs) => {
//     if (batchedArgs.length === 0) {
//       return []
//     }

//     // Deduplicate identical requests
//     const uniqueArgsMap = new Map<string, IGetXmtpConversationsArgs>()
//     const argsToIndexMap = new Map<string, number[]>()

//     // Group identical requests by their key
//     batchedArgs.forEach((args, index) => {
//       const key = createCacheKey(args)

//       // Store unique args
//       if (!uniqueArgsMap.has(key)) {
//         uniqueArgsMap.set(key, args)
//       }

//       // Track which indices in the result array should get this response
//       if (!argsToIndexMap.has(key)) {
//         argsToIndexMap.set(key, [])
//       }
//       argsToIndexMap.get(key)!.push(index)
//     })

//     console.log(
//       `Making ${uniqueArgsMap.size} unique XMTP requests out of ${batchedArgs.length} total`,
//     )

//     // Make only one API call per unique request
//     const uniqueResults = new Map<string, IXmtpConversationWithCodecs[]>()
//     await Promise.all(
//       Array.from(uniqueArgsMap.entries()).map(async ([key, args]) => {
//         const result = await getXmtpConversationsUnbatched(args)
//         uniqueResults.set(key, result)
//       }),
//     )

//     // Create a results array with one entry per original request
//     const results: IXmtpConversationWithCodecs[][] = new Array(batchedArgs.length)

//     // Fill in the results
//     for (const [key, indices] of argsToIndexMap.entries()) {
//       const conversations = uniqueResults.get(key) || []
//       for (const index of indices) {
//         results[index] = conversations
//       }
//     }

//     return results
//   },
//   scheduler: windowScheduler(100),
//   resolver: (results, _query, index) => {
//     return results[index] || []
//   },
// })

async function getXmtpConversationsUnbatched(args: IGetXmtpConversationsArgs) {
  const {
    clientInboxId,
    consentStates,
    limit = 9999, // All of them by default
  } = args

  const startTime = Date.now()

  try {
    const client = await getXmtpClientByInboxId({
      inboxId: clientInboxId,
    })

    const conversations = await client.conversations.list(
      {
        isActive: true,
        addedByInboxId: true,
        name: true,
        imageUrl: true,
        consentState: true,
        lastMessage: true,
        description: true,
      },
      limit,
      consentStates,
    )

    const duration = Date.now() - startTime

    if (duration > config.xmtp.maxMsUntilLogError) {
      captureError(
        new XMTPError({
          error: new Error(
            `Getting conversations took ${duration}ms for inbox: ${clientInboxId}, consentStates: ${consentStates?.join(
              ", ",
            )} and limit: ${limit}`,
          ),
        }),
      )
    }

    return conversations
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Failed to get conversations for inbox: ${clientInboxId}`,
    })
  }
}
