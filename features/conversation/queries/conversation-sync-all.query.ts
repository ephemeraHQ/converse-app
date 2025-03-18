import { queryOptions, skipToken } from "@tanstack/react-query"
import { IConsentState } from "@/features/consent/consent.types"
import { syncAllXmtpConversations } from "@/features/xmtp/xmtp-sync/xmtp-sync"
import { IXmtpInboxId } from "@/features/xmtp/xmtp.types"
import { reactQueryClient } from "@/utils/react-query/react-query.client"

type IArgs = {
  clientInboxId: IXmtpInboxId
  consentStates: IConsentState[]
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

          // React query needs us to return something
          return true
        }
      : skipToken,
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
