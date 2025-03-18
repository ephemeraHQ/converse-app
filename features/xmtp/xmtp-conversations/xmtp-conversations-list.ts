import { create, windowScheduler } from "@yornaath/batshit"
import { config } from "@/config"
import { getXmtpClientByInboxId } from "@/features/xmtp/xmtp-client/xmtp-client"
import {
  IXmtpConsentState,
  IXmtpConversationWithCodecs,
  IXmtpInboxId,
} from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"

type IGetXmtpConversationsArgs = {
  clientInboxId: IXmtpInboxId
  consentStates: IXmtpConsentState[]
  limit?: number
}

export async function getXmtpConversations(args: IGetXmtpConversationsArgs) {
  return getXmtpConversationsBatcher.fetch(args)
}

const getXmtpConversationsBatcher = create<
  IXmtpConversationWithCodecs[],
  IGetXmtpConversationsArgs
>({
  name: "get-xmtp-conversations",
  fetcher: async (batchedArgs: IGetXmtpConversationsArgs[]) => {
    if (batchedArgs.length === 0) {
      return []
    }

    // Create a map to deduplicate requests with the same parameters
    const uniqueRequests = new Map<string, IGetXmtpConversationsArgs>()

    for (const args of batchedArgs) {
      const key = JSON.stringify({
        clientInboxId: args.clientInboxId,
        consentStates: args.consentStates,
        limit: args.limit,
      })

      if (!uniqueRequests.has(key)) {
        uniqueRequests.set(key, args)
      }
    }

    // Only fetch once for each unique set of arguments
    const results = await Promise.all(
      Array.from(uniqueRequests.values()).map(async (args) => getXmtpConversationsUnbatched(args)),
    )

    return results.flat()
  },
  scheduler: windowScheduler(100),
  resolver: (results) => results,
})

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
          error: new Error(`Getting conversations took ${duration}ms for inbox: ${clientInboxId}`),
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
