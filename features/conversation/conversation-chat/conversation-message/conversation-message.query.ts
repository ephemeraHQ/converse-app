import { IXmtpInboxId, IXmtpMessageId } from "@features/xmtp/xmtp.types"
import { queryOptions } from "@tanstack/react-query"
import { getXmtpConversationMessage } from "@/features/xmtp/xmtp-messages/xmtp-messages"
import { reactQueryClient } from "@/utils/react-query/react-query.client"
import { convertXmtpMessageToConvosMessage } from "./utils/convert-xmtp-message-to-convos-message"

type IArgs = {
  clientInboxId: IXmtpInboxId
  xmtpMessageId: IXmtpMessageId
}

async function getConversationMessage(args: IArgs) {
  const { clientInboxId, xmtpMessageId } = args

  const xmtpMessage = await getXmtpConversationMessage({
    messageId: xmtpMessageId,
    clientInboxId,
  })

  if (!xmtpMessage) {
    return null
  }

  return convertXmtpMessageToConvosMessage(xmtpMessage)
}

export function getConversationMessageQueryOptions({
  clientInboxId,
  xmtpMessageId: messageId,
}: IArgs) {
  return queryOptions({
    queryKey: ["conversation-message", clientInboxId, messageId],
    queryFn: () => getConversationMessage({ clientInboxId, xmtpMessageId: messageId }),
    enabled: !!messageId && !!clientInboxId,
  })
}

export function fetchConversationMessageQuery(args: IArgs) {
  return reactQueryClient.fetchQuery(getConversationMessageQueryOptions(args))
}

export function getOrFetchConversationMessageQuery(args: IArgs) {
  return reactQueryClient.ensureQueryData(getConversationMessageQueryOptions(args))
}
