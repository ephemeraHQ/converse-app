import logger from "@/utils/logger";
import { queryOptions } from "@tanstack/react-query";
import { ConverseXmtpClientType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { getXmtpClient } from "@/utils/xmtpRN/xmtp-client/xmtp-client";
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

  if (!account) {
    throw new Error("Account is required");
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

export function getConversationMessageQueryOptions({
  account,
  messageId,
}: IArgs) {
  return queryOptions({
    queryKey: conversationMessageQueryKey(account, messageId),
    queryFn: () => getConversationMessage({ account, messageId }),
    enabled: !!messageId && !!account,
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
