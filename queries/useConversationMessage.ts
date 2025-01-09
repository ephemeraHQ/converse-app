import { UseQueryOptions, useQuery } from "@tanstack/react-query";
import { ConverseXmtpClientType } from "@/utils/xmtpRN/client.types";
import { getOrBuildXmtpClient } from "@utils/xmtpRN/sync";
import { InboxId, MessageId, findMessage } from "@xmtp/react-native-sdk";
import { conversationMessageQueryKey } from "./QueryKeys";
import { queryClient } from "./queryClient";

type ConversationMessage = Awaited<ReturnType<typeof fetchConversationMessage>>;

type IArgs = {
  account: string;
  inboxId: InboxId;
  messageId: MessageId;
};

async function fetchConversationMessage(args: IArgs) {
  const { account, messageId } = args;

  const client = (await getOrBuildXmtpClient({
    account,
  })) as ConverseXmtpClientType;

  if (!client) {
    return null;
  }

  const message = await findMessage(client, messageId);

  return message;
}

export const useConversationMessage = (args: IArgs) => {
  return useQuery(getConversationMessageQueryOptions(args));
};

export function getConversationMessageQueryOptions(
  args: IArgs
): UseQueryOptions<ConversationMessage> {
  return {
    queryKey: conversationMessageQueryKey({
      inboxId: args.inboxId,
      messageId: args.messageId,
    }),
    queryFn: () => fetchConversationMessage(args),
    enabled: !!args.messageId && !!args.account,
  };
}

export const getConversationMessage = (args: IArgs) => {
  return queryClient.getQueryData<ConversationMessage>(
    getConversationMessageQueryOptions(args).queryKey
  );
};

export function fetchMessageByIdQuery(args: IArgs) {
  return queryClient.fetchQuery(getConversationMessageQueryOptions(args));
}
