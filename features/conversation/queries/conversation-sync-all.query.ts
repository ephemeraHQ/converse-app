import { queryOptions, skipToken } from "@tanstack/react-query"
import { ConsentState, InboxId } from "@xmtp/react-native-sdk"
import { syncAllXmtpConversations } from "@/features/xmtp/xmtp-sync/xmtp-sync"
import { reactQueryClient } from "@/utils/react-query/react-query.client"

type IArgs = {
  clientInboxId: InboxId
  consentStates: ConsentState[]
}

export function getConversationSyncAllQueryOptions(args: IArgs) {
  const enabled = !!args.clientInboxId

  return queryOptions({
    enabled,
    queryKey: ["conversation-sync-all", args.clientInboxId, ...args.consentStates],
    queryFn: args.clientInboxId
      ? async () => {
          await syncAllXmtpConversations({
            clientInboxId: args.clientInboxId,
            consentStates: args.consentStates,
          })
        }
      : skipToken,
  })
}

export function ensureConversationSyncAllQuery(args: IArgs) {
  return reactQueryClient.ensureQueryData(getConversationSyncAllQueryOptions(args))
}
