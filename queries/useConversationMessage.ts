import logger from "@/utils/logger";
import { ConverseXmtpClientType } from "@/utils/xmtpRN/client.types";
import { queryOptions } from "@tanstack/react-query";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import { MessageId } from "@xmtp/react-native-sdk";
import { conversationMessageQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";

type IArgs = {
  account: string;
  messageId: MessageId;
};

async function getConversationMessage(args: IArgs) {
  const { account, messageId } = args;

  if (!messageId) {
    throw new Error("Message ID is required");
  }

  logger.debug(
    `[useConversationMessage] Fetching message ${messageId} for account ${account}`
  );

  const xmtpClient = (await getXmtpClient(account)) as ConverseXmtpClientType;

  if (!xmtpClient) {
    throw new Error("XMTP client not found");
  }

  const message = await xmtpClient.conversations.findMessage(messageId);

  return message;
}

export function getConversationMessageQueryOptions(args: IArgs) {
  return queryOptions({
    queryKey: conversationMessageQueryKey(args.account, args.messageId),
    queryFn: () => getConversationMessage(args),
    enabled: !!args.messageId && !!args.account,
  });
}

export function fetchConversationMessageQuery(args: IArgs) {
  return queryClient.fetchQuery(getConversationMessageQueryOptions(args));
}

export function getOrFetchConversationMessageQuery(args: IArgs) {
  return (
    queryClient.getQueryData(
      conversationMessageQueryKey(args.account, args.messageId)
    ) ?? fetchConversationMessageQuery(args)
  );
}
