import { IXmtpInboxId, IXmtpMessageId } from "@features/xmtp/xmtp.types"
import { queryOptions } from "@tanstack/react-query"
import { convertXmtpMessageToConvosMessage } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.utils"
import { getXmtpConversationMessage } from "@/features/xmtp/xmtp-messages/xmtp-messages"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { IConversationMessageId } from "./conversation-message.types"

type IArgs = {
  clientInboxId: IXmtpInboxId
  messageId: IConversationMessageId
}

async function getConversationMessage(args: IArgs) {
  const { clientInboxId, messageId } = args

  const xmtpMessage = await getXmtpConversationMessage({
    messageId: messageId as unknown as IXmtpMessageId,
    clientInboxId,
  })

  if (!xmtpMessage) {
    return null
  }

  return convertXmtpMessageToConvosMessage(xmtpMessage)
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
