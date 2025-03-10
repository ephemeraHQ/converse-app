import { queryOptions } from "@tanstack/react-query"
import { MessageId } from "@xmtp/react-native-sdk"
import { getXmtpClientByEthAddress } from "@/features/xmtp/xmtp-client/xmtp-client.service"
import { logger } from "@/utils/logger"
import { conversationMessageQueryKey } from "../../queries/QueryKeys"
import { reactQueryClient } from "../../utils/react-query/react-query.client"

type IArgs = {
  account: string
  messageId: MessageId
}

async function getConversationMessage(args: IArgs) {
  const { account, messageId } = args

  if (!messageId) {
    throw new Error("Message ID is required")
  }

  if (!account) {
    throw new Error("Account is required")
  }

  logger.debug(`[useConversationMessage] Fetching message ${messageId} for account ${account}`)

  const xmtpClient = await getXmtpClientByEthAddress({
    ethAddress: account,
  })

  if (!xmtpClient) {
    throw new Error("XMTP client not found")
  }

  const message = await xmtpClient.conversations.findMessage(messageId)

  return message
}

export function getConversationMessageQueryOptions({ account, messageId }: IArgs) {
  return queryOptions({
    queryKey: conversationMessageQueryKey(account, messageId),
    queryFn: () => getConversationMessage({ account, messageId }),
    enabled: !!messageId && !!account,
  })
}

export function fetchConversationMessageQuery(args: IArgs) {
  return reactQueryClient.fetchQuery(getConversationMessageQueryOptions(args))
}

export function getOrFetchConversationMessageQuery(args: IArgs) {
  return (
    reactQueryClient.getQueryData(conversationMessageQueryKey(args.account, args.messageId)) ??
    fetchConversationMessageQuery(args)
  )
}
