import { unknownConsentConversationsQueryKey } from "@/queries/QueryKeys";
import { setConversationQueryData } from "@/queries/useConversationQuery";
import { captureError } from "@/utils/capture-error";
import logger from "@/utils/logger";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import {
  ConversationWithCodecsType,
  ConverseXmtpClientType,
} from "@/utils/xmtpRN/client.types";
import { getXmtpClient } from "@/utils/xmtpRN/xmtp-client/xmtp-client";
import { queryOptions } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { queryClient } from "./queryClient";

export type IUnknownConversationsQuery = Awaited<
  ReturnType<typeof getUnknownConversations>
>;

async function getUnknownConversations(args: { account: string }) {
  const { account } = args;

  logger.debug(
    `[ConversationsQuery] Fetching conversations from network for account ${account}`
  );

  const client = (await getXmtpClient(account)) as ConverseXmtpClientType;

  const beforeSync = new Date().getTime();
  await client.conversations.syncAllConversations(["unknown"]);
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
    20, // For now we only fetch 20 until we have the right pagination system. At least people will be able to see their conversations
    ["unknown"]
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

export const prefetchUnknownConsentConversationsQuery = (args: {
  account: string;
}) => {
  return queryClient.prefetchQuery(
    getUnknownConsentConversationsQueryOptions(args)
  );
};

export const addConversationToUnknownConsentConversationsQuery = (args: {
  account: string;
  conversation: ConversationWithCodecsType;
}) => {
  const { account, conversation } = args;

  logger.debug(
    `[UnknownConversationsQuery] addConversationToUnknownConsentConversationsQuery for account ${account}`
  );

  const previousConversationsData = getUnknownConsentConversationsQueryData({
    account,
  });

  if (!previousConversationsData) {
    queryClient.setQueryData<IUnknownConversationsQuery>(
      getUnknownConsentConversationsQueryOptions({ account }).queryKey,
      [conversation]
    );
    return;
  }

  const conversationExists = previousConversationsData.some(
    (c) => c.topic === conversation.topic
  );

  if (conversationExists) {
    return;
  }

  queryClient.setQueryData<IUnknownConversationsQuery>(
    getUnknownConsentConversationsQueryOptions({ account }).queryKey,
    [conversation, ...previousConversationsData]
  );
};

export const getUnknownConsentConversationsQueryData = (args: {
  account: string;
}) => {
  return queryClient.getQueryData<IUnknownConversationsQuery>(
    getUnknownConsentConversationsQueryOptions(args).queryKey
  );
};

export const updateConversationInUnknownConsentConversationsQueryData = (args: {
  account: string;
  topic: ConversationTopic;
  conversationUpdate: Partial<ConversationWithCodecsType>;
}) => {
  const { account, topic, conversationUpdate } = args;

  logger.debug(
    `[UnknownConversationsQuery] updateConversationInUnknownConsentConversationsQueryData for account ${account} and topic ${topic}`
  );

  const previousConversationsData = getUnknownConsentConversationsQueryData({
    account,
  });
  if (!previousConversationsData) {
    return;
  }
  const newConversations = previousConversationsData.map((c) => {
    if (c.topic === topic) {
      return updateObjectAndMethods(c, conversationUpdate);
    }
    return c;
  });

  queryClient.setQueryData<IUnknownConversationsQuery>(
    getUnknownConsentConversationsQueryOptions({
      account,
    }).queryKey,
    newConversations
  );
};

export const removeConversationFromUnknownConsentConversationsQueryData =
  (args: { account: string; topic: ConversationTopic }) => {
    const { account, topic } = args;

    logger.debug(
      `[UnknownConversationsQuery] removeConversationFromUnknownConsentConversationsQueryData for account ${account} and topic ${topic}`
    );

    const previousConversationsData = getUnknownConsentConversationsQueryData({
      account,
    });

    if (!previousConversationsData) {
      return;
    }

    const newConversations = previousConversationsData.filter(
      (conversation) => conversation.topic !== topic
    );

    queryClient.setQueryData<IUnknownConversationsQuery>(
      getUnknownConsentConversationsQueryOptions({ account }).queryKey,
      newConversations
    );
  };

export function getUnknownConsentConversationsQueryOptions(args: {
  account: string;
  caller?: string;
}) {
  const { account, caller } = args;
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: unknownConsentConversationsQueryKey(account),
    queryFn: () =>
      getUnknownConversations({
        account,
      }),
    enabled: !!account,
    refetchOnMount: true, // Just for now to make sure we always have the lastest conversations
  });
}
