import {
  getConversationQueryData,
  setConversationQueryData,
} from "@/queries/conversation-query";
import { ensureConversationSyncAllQuery } from "@/queries/conversation-sync-all-query";
import { Optional } from "@/types/general";
import { captureError } from "@/utils/capture-error";
import { updateObjectAndMethods } from "@/utils/update-object-and-methods";
import { getXmtpClient } from "@/utils/xmtpRN/xmtp-client/xmtp-client";
import { ConversationWithCodecsType } from "@/utils/xmtpRN/xmtp-client/xmtp-client.types";
import { allowedConsentConversationsQueryKey } from "@queries/QueryKeys";
import {
  QueryObserver,
  queryOptions,
  useQuery,
  skipToken,
} from "@tanstack/react-query";
import { ConversationTopic } from "@xmtp/react-native-sdk";
import { queryClient } from "./queryClient";
import { ensureGroupMembersQueryData } from "./useGroupMembersQuery";

export type IAllowedConsentConversationsQuery = Awaited<
  ReturnType<typeof getAllowedConsentConversations>
>;

type IArgs = {
  account: string;
};

type IArgsWithCaller = IArgs & { caller: string };

export const createAllowedConsentConversationsQueryObserver = (
  args: IArgs & { caller: string }
) => {
  return new QueryObserver(
    queryClient,
    getAllowedConsentConversationsQueryOptions(args)
  );
};

export const useAllowedConsentConversationsQuery = (
  args: IArgs & { caller: string }
) => {
  return useQuery(getAllowedConsentConversationsQueryOptions(args));
};

export function addConversationToAllowedConsentConversationsQuery(
  args: IArgs & {
    conversation: ConversationWithCodecsType;
  }
) {
  const { account, conversation } = args;

  const previousConversationsData = getAllowedConsentConversationsQueryData({
    account,
  });

  if (!previousConversationsData) {
    queryClient.setQueryData(
      getAllowedConsentConversationsQueryOptions({ account }).queryKey,
      [conversation]
    );
    return;
  }

  const conversationExists = previousConversationsData.some(
    (c) => c.topic === conversation.topic
  );

  if (conversationExists) {
    return updateConversationInAllowedConsentConversationsQueryData({
      account,
      topic: conversation.topic,
      conversationUpdate: conversation,
    });
  }

  queryClient.setQueryData<IAllowedConsentConversationsQuery>(
    getAllowedConsentConversationsQueryOptions({ account }).queryKey,
    [conversation, ...previousConversationsData]
  );
}

export const removeConversationFromAllowedConsentConversationsQuery = (
  args: IArgs & {
    topic: ConversationTopic;
  }
) => {
  const { account, topic } = args;

  const previousConversationsData = getAllowedConsentConversationsQueryData({
    account,
  });

  if (!previousConversationsData) {
    return;
  }

  queryClient.setQueryData(
    getAllowedConsentConversationsQueryOptions({ account }).queryKey,
    previousConversationsData.filter((c) => c.topic !== topic)
  );
};

export const getAllowedConsentConversationsQueryData = (args: IArgs) => {
  return queryClient.getQueryData(
    getAllowedConsentConversationsQueryOptions(args).queryKey
  );
};

const getAllowedConsentConversations = async (args: IArgs) => {
  const { account } = args;

  await ensureConversationSyncAllQuery({
    ethAddress: account,
    consentStates: ["allowed"],
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
    9999, // All of them
    ["allowed"]
  );

  for (const conversation of conversations) {
    // Only set if the conversation is not already in the query cache
    // Because otherwise we might put a outdated conversation in the query cache.
    if (!getConversationQueryData({ account, topic: conversation.topic })) {
      setConversationQueryData({
        account,
        topic: conversation.topic,
        conversation,
      });
    }

    // We are often using conversation members info
    // Call after setting the conversation because we'll need the conversation to get the members
    ensureGroupMembersQueryData({
      caller: "getAllowedConsentConversations",
      account,
      topic: conversation.topic,
    }).catch(captureError);
  }

  return conversations;
};

export const getAllowedConsentConversationsQueryOptions = (
  args: Optional<IArgsWithCaller, "caller">
) => {
  const { account, caller } = args;
  const enabled = !!account;
  return queryOptions({
    meta: {
      caller,
    },
    queryKey: allowedConsentConversationsQueryKey(account),
    queryFn: enabled
      ? () => getAllowedConsentConversations({ account })
      : skipToken,
    enabled,
  });
};

export const updateConversationInAllowedConsentConversationsQueryData = (
  args: IArgs & {
    topic: ConversationTopic;
    conversationUpdate: Partial<ConversationWithCodecsType>;
  }
) => {
  const { account, topic, conversationUpdate } = args;

  const previousConversationsData = getAllowedConsentConversationsQueryData({
    account,
  });

  if (!previousConversationsData) {
    captureError(
      new Error(
        `No previous conversations data found for account: ${account} when updating conversation in allowed consent conversations query data: ${JSON.stringify(
          conversationUpdate
        )}`
      )
    );
    return;
  }

  const newConversations = previousConversationsData.map((c) => {
    if (c.topic === topic) {
      return updateObjectAndMethods(c, conversationUpdate);
    }
    return c;
  });

  queryClient.setQueryData<IAllowedConsentConversationsQuery>(
    getAllowedConsentConversationsQueryOptions({
      account,
    }).queryKey,
    newConversations
  );
};

export function fetchAllowedConsentConversationsQuery(args: IArgsWithCaller) {
  return queryClient.fetchQuery(
    getAllowedConsentConversationsQueryOptions(args)
  );
}
