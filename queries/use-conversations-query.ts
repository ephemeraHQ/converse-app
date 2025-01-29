import { setConversationQueryData } from "@/queries/useConversationQuery";
import { captureError } from "@/utils/capture-error";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { getXmtpClient } from "@/utils/xmtpRN/xmtp-client/xmtp-client";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { conversationsQueryKey } from "@queries/QueryKeys";
import { QueryObserver, queryOptions, useQuery } from "@tanstack/react-query";
import logger from "@utils/logger";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { queryClient } from "./queryClient";

export type IConversationsQuery = Awaited<ReturnType<typeof getConversations>>;

type IArgs = {
  account: string;
};

export const createConversationsQueryObserver = (
  args: IArgs & { caller: string }
) => {
  return new QueryObserver(queryClient, getConversationsQueryOptions(args));
};

export const useConversationsQuery = (args: IArgs & { caller: string }) => {
  return useQuery<IConversationsQuery>(getConversationsQueryOptions(args));
};

export function addConversationToConversationsQuery(
  args: IArgs & {
    conversation: ConversationWithCodecsType;
  }
) {
  const { account, conversation } = args;
  logger.debug(
    `[ConversationsQuery] addConversationToConversationsQuery for account ${account}`
  );
  const previousConversationsData = getConversationsQueryData({
    account,
  });

  if (!previousConversationsData) {
    queryClient.setQueryData<IConversationsQuery>(
      getConversationsQueryOptions({ account }).queryKey,
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

  queryClient.setQueryData<IConversationsQuery>(
    getConversationsQueryOptions({ account }).queryKey,
    [conversation, ...previousConversationsData]
  );
}

export const removeConversationFromConversationsQuery = (
  args: IArgs & {
    topic: ConversationTopic;
  }
) => {
  const { account, topic } = args;

  logger.debug(
    `[ConversationsQuery] removeConversationFromConversationsQuery for account ${account}`
  );

  const previousConversationsData = getConversationsQueryData({
    account,
  });

  if (!previousConversationsData) {
    return;
  }

  queryClient.setQueryData(
    getConversationsQueryOptions({ account }).queryKey,
    previousConversationsData.filter((c) => c.topic !== topic)
  );
};

export const getConversationsQueryData = (args: IArgs) => {
  return queryClient.getQueryData<IConversationsQuery>(
    getConversationsQueryOptions(args).queryKey
  );
};

const getConversations = async (args: IArgs) => {
  const { account } = args;

  const client = await getXmtpClient({
    address: account,
  });

  const beforeSync = new Date().getTime();
  await client.conversations.syncAllConversations(["allowed"]);
  const afterSync = new Date().getTime();

  const timeDiff = afterSync - beforeSync;
  if (timeDiff > 3000) {
    captureError(
      new Error(
        `[ConversationsQuery] Fetching conversations from network took ${timeDiff}ms for account ${account}`
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
    ["allowed"]
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
};

export const getConversationsQueryOptions = (
  args: IArgs & {
    // Optional because we don't want functions that just get or set query data to have to pass caller
    caller?: string;
  }
) => {
  const { account, caller } = args;
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: conversationsQueryKey(account),
    queryFn: () =>
      getConversations({
        account,
      }),
    enabled: !!account,
    // Just for now because conversations are very important and
    // we want to make sure we have all of them
    refetchOnMount: true,
    // persister: reactQueryPersister,
  });
};

export const updateConversationInConversationsQueryData = (
  args: IArgs & {
    topic: ConversationTopic;
    conversationUpdate: Partial<ConversationWithCodecsType>;
  }
) => {
  const { account, topic, conversationUpdate } = args;

  logger.debug(
    `[ConversationsQuery] updateConversationInConversationsQueryData for account ${account} and topic ${topic}`
  );

  const previousConversationsData = getConversationsQueryData({
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

  queryClient.setQueryData<IConversationsQuery>(
    getConversationsQueryOptions({
      account,
    }).queryKey,
    newConversations
  );
};

export function fetchConversationsQuery(args: IArgs & { caller: string }) {
  return queryClient.fetchQuery(getConversationsQueryOptions(args));
}
