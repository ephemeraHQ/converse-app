import { queryOptions } from "@tanstack/react-query"
import { InboxId, MessageId } from "@xmtp/react-native-sdk"
import { getXmtpConversationMessage } from "@/features/xmtp/xmtp-messages/xmtp-messages"
import { reactQueryClient } from "@/utils/react-query/react-query.client"

type IArgs = {
  clientInboxId: InboxId
  messageId: MessageId
}

async function getConversationMessage(args: IArgs) {
  const { clientInboxId: account, messageId } = args
  return getXmtpConversationMessage({
    messageId,
    clientInboxId: account,
  })
}

export function getConversationMessageQueryOptions({ clientInboxId, messageId }: IArgs) {
  return queryOptions({
    queryKey: ["conversation-message", clientInboxId, messageId],
    queryFn: () => getConversationMessage({ clientInboxId, messageId }),
    enabled: !!messageId && !!clientInboxId,
  })
}

export function fetchConversationMessageQuery(args: IArgs) {
  return reactQueryClient.fetchQuery(getConversationMessageQueryOptions(args))
}

export function getOrFetchConversationMessageQuery(args: IArgs) {
  return reactQueryClient.ensureQueryData(getConversationMessageQueryOptions(args))
}
