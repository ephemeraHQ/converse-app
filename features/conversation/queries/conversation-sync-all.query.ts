import { queryOptions, skipToken } from "@tanstack/react-query"
import { syncAllXmtpConversations } from "@/features/xmtp/xmtp-sync/xmtp-sync"
import { IXmtpConsentState, IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { reactQueryClient } from "@/utils/react-query/react-query.client"

type IArgs = {
  clientInboxId: IXmtpInboxId
  consentStates: IXmtpConsentState[]
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
