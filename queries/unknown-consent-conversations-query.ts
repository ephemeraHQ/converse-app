import { unknownConsentConversationsQueryKey } from "@/queries/QueryKeys";
import { setConversationQueryData } from "@/queries/useConversationQuery";
import { captureError } from "@/utils/capture-error";
import logger from "@/utils/logger";
import { ConverseXmtpClientType } from "@/utils/xmtpRN/client.types";
import { getXmtpClient } from "@/utils/xmtpRN/sync";
import { queryOptions } from "@tanstack/react-query";

async function getUnknownConversations(args: { account: string }) {
  const { account } = args;

  logger.debug(
    `[ConversationsQuery] Fetching conversations from network for account ${account}`
  );

  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;

  const beforeSync = new Date().getTime();
  await client.conversations.syncAllConversations("unknown");
  const afterSync = new Date().getTime();

  const timeDiff = afterSync - beforeSync;
  if (timeDiff > 3000) {
    captureError(
      new Error(
        `[ConversationsQuery] Fetching conversations from network took ${timeDiff}ms`
      )
    );
  }

  const conversations = await client.conversations.list(
    {
      isActive: true,
      addedByInboxId: true,
      name: true,
      imageUrlSquare: true,
      consentState: true,
      lastMessage: true,
      description: true,
    },
    20 // For now we only fetch 20 until we have the right pagination system. At least people will be able to see their conversations
  );

  // For now conversations have all the same properties as one conversation
  for (const conversation of conversations) {
    setConversationQueryData({
      account,
      topic: conversation.topic,
      conversation,
    });
  }

  return conversations;
}

export function getUnknownConsentConversationsQueryOptions(args: {
  account: string;
}) {
  const { account } = args;
  return queryOptions({
    queryFn: () => getUnknownConversations({ account }),
    queryKey: unknownConsentConversationsQueryKey(account),
    enabled: !!account,
  });
}
