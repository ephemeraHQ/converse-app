import { UseQueryOptions, useQuery, queryOptions } from "@tanstack/react-query";
import { ConverseXmtpClientType } from "@/utils/xmtpRN/client.types";
import { getXmtpClient } from "@utils/xmtpRN/sync";
import { MessageId, findMessage } from "@xmtp/react-native-sdk";
import { conversationMessageQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";

type ConversationMessage = Awaited<ReturnType<typeof fetchConversationMessage>>;

type IArgs = {
  account: string;
  messageId: MessageId;
};

async function fetchConversationMessage(args: IArgs) {
  const { account, messageId } = args;

  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;

  if (!client) {
    return null;
  }

  const message = await findMessage(client, messageId);

  return message;
}

export const useConversationMessage = (args: IArgs) => {
  return useQuery(getConversationMessageQueryOptions(args));
};

export function getConversationMessageQueryOptions({
  account,
  messageId,
}: IArgs) {
  return queryOptions({
    queryKey: conversationMessageQueryKey(account, messageId),
    queryFn: () => fetchConversationMessage({ account, messageId }),
    enabled: !!messageId && !!account,
  });
}

export const getConversationMessage = (args: IArgs) => {
  return queryClient.getQueryData<ConversationMessage>(
    getConversationMessageQueryOptions(args).queryKey
  );
};

export function fetchMessageByIdQuery(args: IArgs) {
  return queryClient.fetchQuery(getConversationMessageQueryOptions(args));
}
