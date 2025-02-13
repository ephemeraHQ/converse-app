import { unknownConsentConversationsQueryKey } from "@/queries/QueryKeys";
import { setConversationQueryData } from "@/queries/conversation-query";
import { ensureConversationSyncAllQuery } from "@/queries/conversation-sync-all-query";
import logger from "@/utils/logger";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { getXmtpClient } from "@/utils/xmtpRN/xmtp-client/xmtp-client";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { queryOptions, skipToken } from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { queryClient } from "./queryClient";
import {
  useMultiInboxClientStore,
  AuthStatuses,
} from "@/features/multi-inbox/multi-inbox.store";

export type IUnknownConversationsQuery = Awaited<
  ReturnType<typeof getUnknownConversations>
>;

async function getUnknownConversations(args: { account: string }) {
  const { account } = args;

  if (!account) {
    throw new Error("Account is required");
  }

  await ensureConversationSyncAllQuery({
    ethAddress: account,
    consentStates: ["unknown"],
  });

  const client = await getXmtpClient({
    address: account,
  });

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
  const isSignedIn =
    useMultiInboxClientStore.getState().authStatus === AuthStatuses.signedIn;
  const enabled = !!account && isSignedIn;
  return queryOptions({
    enabled,
    meta: {
      caller,
    },
    queryKey: unknownConsentConversationsQueryKey(account),
    queryFn: enabled
      ? async () =>
          getUnknownConversations({
            account,
          })
      : skipToken,
    refetchOnMount: true, // Just for now to make sure we always have the lastest conversations
  });
}
