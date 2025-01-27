import { getCurrentAccount } from "@/data/store/accountsStore";
import {
  addConversationMessageQuery,
  getConversationMessagesQueryOptions,
  refetchConversationMessages,
  replaceOptimisticMessageWithReal,
} from "@/queries/use-conversation-messages-query";
import { captureErrorWithToast } from "@/utils/capture-error";
import { getTodayNs } from "@/utils/date";
import { getRandomId } from "@/utils/general";
import { contentTypesPrefixes } from "@/utils/xmtpRN/content-types/content-types";
import { useMutation } from "@tanstack/react-query";
import {
  ConversationTopic,
  DecodedMessage,
  Dm,
  MessageDeliveryStatus,
  MessageId,
  RemoteAttachmentContent,
  Group,
} from "@xmtp/react-native-sdk";
import { useCallback } from "react";
import {
  getOrFetchConversation,
  getConversationQueryOptions,
} from "@/queries/useConversationQuery";
import { generateGroupHashFromMemberIds } from "@/features/create-conversation/generate-group-hash-from-member-ids";
import {
  createGroupWithDefaultsByAccount,
  createConversationByAccount,
} from "@/utils/xmtpRN/conversations";
import {
  addConversationToConversationsQuery,
  getConversationsQueryOptions,
  removeConversationFromConversationsQuery,
} from "@/queries/use-conversations-query";
import { setDmQueryData } from "@/queries/useDmQuery";
import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import { sentryTrackError } from "@/utils/sentry";
import {
  ConversationWithCodecsType,
  SupportedCodecsType,
} from "@/utils/xmtpRN/client.types";
import {
  conversationMessagesQueryKey,
  conversationsQueryKey,
} from "@/queries/QueryKeys";
import { queryClient } from "@/queries/queryClient";
import { getConversationMessageQueryOptions } from "@/queries/useConversationMessage";
import logger from "@/utils/logger";

export type ISendMessageParams = {
  topic: ConversationTopic;
  referencedMessageId?: MessageId;
  content:
    | { text: string; remoteAttachment?: RemoteAttachmentContent }
    | { text?: string; remoteAttachment: RemoteAttachmentContent };
};

export type ISendFirstMessageParams = Omit<ISendMessageParams, "topic">;

export async function sendMessage(
  args: ISendMessageParams
): Promise<MessageId> {
  const { referencedMessageId, content, topic } = args;
  logger.info("[send-optimistic][sendMessage] Starting to send message", {
    referencedMessageId,
    content: JSON.stringify(content, null, 2),
    topic,
  });

  const conversation = await getOrFetchConversation({
    topic,
    account: getCurrentAccount()!,
    caller: "use-send-message#sendMessage",
  });

  if (!conversation) {
    logger.error("[send-optimistic][sendMessage] Conversation not found");
    throw new Error("Conversation not found when sending message");
  }

  logger.info("[send-optimistic][sendMessage] Found conversation", {
    conversationTopic: conversation.topic,
  });

  let messageId: MessageId;
  if (referencedMessageId) {
    logger.info("[send-optimistic][sendMessage] Sending reply message");
    messageId = await conversation.send({
      reply: {
        reference: referencedMessageId,
        content: content.remoteAttachment
          ? { remoteAttachment: content.remoteAttachment }
          : { text: content.text },
      },
    });
  } else {
    logger.info("[send-optimistic][sendMessage] Sending new message");
    messageId = await conversation.send(
      content.remoteAttachment
        ? { remoteAttachment: content.remoteAttachment }
        : { text: content.text! }
    );
  }

  logger.info("[send-optimistic][sendMessage] Message sent successfully", {
    messageId,
  });
  return messageId;
}

type IUseOptimisticSendFirstMessageParams = {
  members: string[];
};

type IOptimisticSendFirstMessageParams = {
  content: { text: string };
  tempTopic?: string;
};

type SendMessageResult = {
  success: boolean;
  tempTopic?: string;
};

type SendMessageMutationVariables = {
  content: { text: string };
  conversationTopic: string;
};

type SendMessageMutationContext = {
  generatedMessageId: string;
  tempTopic?: string;
};

export function useOptimisticSendFirstMessage({
  members,
}: IUseOptimisticSendFirstMessageParams) {
  const currentAccount = getCurrentAccount()!;
  const isGroup = members.length > 1;

  const tempTopic = generateGroupHashFromMemberIds(members);

  logger.info("[send-optimistic][useOptimisticSendFirstMessage] Initialized", {
    members: JSON.stringify(members, null, 2),
    isGroup,
    tempTopic,
    currentAccount,
  });

  const {
    mutateAsync: createConversationAsync,
    isPending,
    isError,
  } = useMutation<
    Group<SupportedCodecsType> | Dm<SupportedCodecsType>,
    Error,
    void,
    unknown
  >({
    mutationFn: async () => {
      logger.info(
        "[send-optimistic][createConversation] Starting conversation creation"
      );
      if (!members.length) {
        logger.error(
          "[send-optimistic][createConversation] No members provided"
        );
        throw new Error("No members provided");
      }
      if (!tempTopic) {
        logger.error(
          "[send-optimistic][createConversation] Failed to generate temp topic"
        );
        throw new Error("Failed to generate temp topic");
      }

      let conversation;
      if (isGroup) {
        logger.info(
          "[send-optimistic][createConversation] Creating group conversation"
        );
        conversation = await createGroupWithDefaultsByAccount({
          account: currentAccount,
          peerEthereumAddresses: members,
        });
      } else {
        logger.info(
          "[send-optimistic][createConversation] Creating DM conversation"
        );
        conversation = await createConversationByAccount(
          currentAccount,
          members[0]
        );
      }

      logger.info(
        "[send-optimistic][createConversation] Conversation created successfully",
        {
          topic: conversation.topic,
          type: isGroup ? "group" : "dm",
        }
      );

      return conversation;
    },
    onSuccess: (newConversation) => {
      logger.info(
        "[send-optimistic][createConversation] Processing successful creation",
        {
          conversationTopic: newConversation.topic,
        }
      );

      addConversationToConversationsQuery({
        account: currentAccount,
        conversation: newConversation,
      });

      replaceOptimisticConversationWithReal({
        account: currentAccount,
        tempTopic: tempTopic!,
        realTopic: newConversation.topic,
      });

      if (!isGroup) {
        logger.info(
          "[send-optimistic][createConversation] Setting DM query data"
        );
        setDmQueryData({
          account: currentAccount,
          peer: members[0],
          dm: newConversation as Dm<SupportedCodecsType>,
        });
      }
    },
  });

  const { mutateAsync: sendMessageAsync } = useMutation<
    MessageId,
    Error,
    SendMessageMutationVariables,
    SendMessageMutationContext
  >({
    mutationFn: async (args): Promise<MessageId> => {
      const conversation = await createConversationAsync();

      await ensureConversationInCache({
        account: currentAccount,
        topic: conversation.topic,
      });

      return sendMessage({
        topic: conversation.topic,
        content: args.content,
      });
    },
    onMutate: async (variables) => {
      logger.info(
        "[send-optimistic][sendMessageAsync] Preparing optimistic update",
        {
          variables: JSON.stringify(variables, null, 2),
        }
      );

      if (!tempTopic) {
        logger.error(
          "[send-optimistic][sendMessageAsync] Temp topic required for group messages"
        );
        throw new Error("Temp topic required for group messages");
      }

      const generatedMessageId = getRandomId();

      const optimisticMessage: DecodedMessage = {
        id: generatedMessageId as MessageId,
        // @ts-expect-error we are doing this on purpose for optimstic message
        tempOptimisticId: generatedMessageId,
        contentTypeId: contentTypesPrefixes.text,
        sentNs: getTodayNs(),
        fallback: "new-message",
        deliveryStatus: "sending" as MessageDeliveryStatus,
        topic: tempTopic as unknown as ConversationTopic, // Safe cast since this is temporary
        senderInboxId: currentAccount,
        nativeContent: {},
        content: () => variables.content.text,
      };

      logger.info(
        "[send-optimistic][sendMessageAsync] Created optimistic message",
        {
          message: JSON.stringify(optimisticMessage, null, 2),
        }
      );

      addConversationMessageQuery({
        account: currentAccount,
        topic: tempTopic as unknown as ConversationTopic,
        message: optimisticMessage,
      });

      return { generatedMessageId, tempTopic };
    },
    onSuccess: (messageId, variables, context) => {
      logger.info(
        "[send-optimistic][sendMessageAsync] Processing successful send",
        {
          messageId,
          context: JSON.stringify(context, null, 2),
        }
      );

      if (context?.generatedMessageId) {
        replaceOptimisticMessageWithReal({
          tempId: context.generatedMessageId,
          topic: context.tempTopic as unknown as ConversationTopic,
          account: currentAccount,
          realMessage: {
            id: messageId,
            content: () => variables.content.text,
            // ... other required message properties
          } as DecodedMessage,
        });
      }
    },
    onError: (error, variables, context) => {
      logger.error(
        "[send-optimistic][sendMessageAsync] Error sending message",
        {
          error,
          context: JSON.stringify(context, null, 2),
        }
      );

      if (context?.tempTopic) {
        queryClient.removeQueries({
          queryKey: conversationMessagesQueryKey(
            currentAccount,
            context.tempTopic as ConversationTopic
          ),
        });
        queryClient.setQueryData(
          conversationsQueryKey(currentAccount),
          (previous: ConversationWithCodecsType[] = []) =>
            previous.filter((conv) => conv.topic !== context.tempTopic)
        );
      }
      sentryTrackError(error);
    },
  });

  const sendMessageCallback = useCallback(
    async (params: IOptimisticSendFirstMessageParams): Promise<boolean> => {
      logger.info(
        "[send-optimistic][sendMessageCallback] Starting send message flow",
        {
          params: JSON.stringify(params, null, 2),
        }
      );

      try {
        await sendMessageAsync({
          content: params.content,
          conversationTopic: tempTopic,
        });
        logger.info(
          "[send-optimistic][sendMessageCallback] Message sent successfully"
        );
        return true;
      } catch (error) {
        logger.error(
          "[send-optimistic][sendMessageCallback] Failed to send message",
          error
        );
        showSnackbar({
          message: isGroup
            ? "Failed to create group"
            : "Failed to start conversation",
        });
        return false;
      }
    },
    [sendMessageAsync, isGroup, tempTopic]
  );

  return {
    sendMessage: sendMessageCallback,
    tempTopic,
    isLoading: isPending,
    isError,
  };
}

function replaceOptimisticConversationWithReal(args: {
  account: string;
  tempTopic: string;
  realTopic: ConversationTopic;
}) {
  const { account, tempTopic, realTopic } = args;

  try {
    const messages =
      queryClient.getQueryData<DecodedMessage[]>(
        conversationMessagesQueryKey(account, tempTopic as ConversationTopic)
      ) || []; // Handle undefined case

    if (messages.length > 0) {
      queryClient.setQueryData(
        conversationMessagesQueryKey(account, realTopic),
        messages.map((msg) => ({
          ...msg,
          topic: realTopic,
          // Preserve existing delivery status
          deliveryStatus: msg.deliveryStatus || "sent",
        }))
      );
    }

    // Add retry logic for cache cleanup
    const cleanupCache = () => {
      queryClient.removeQueries({
        queryKey: conversationMessagesQueryKey(
          account,
          tempTopic as ConversationTopic
        ),
      });

      queryClient.setQueryData<ConversationWithCodecsType[]>(
        conversationsQueryKey(account),
        (previous) =>
          (previous ?? []).filter((conv) => conv.topic !== tempTopic)
      );
    };

    // First attempt
    cleanupCache();

    // Schedule secondary cleanup in case of race conditions
    setTimeout(cleanupCache, 500);
  } catch (error) {
    captureErrorWithToast(error);
  }
}

async function ensureConversationInCache(args: {
  account: string;
  topic: ConversationTopic;
}) {
  const MAX_RETRIES = 3;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    const existing = queryClient.getQueryData<ConversationWithCodecsType>(
      getConversationQueryOptions({
        account: args.account,
        topic: args.topic,
        caller: "ensureConversationInCache",
      }).queryKey
    );

    if (existing) return;

    await queryClient.refetchQueries({
      queryKey: getConversationQueryOptions({
        account: args.account,
        topic: args.topic,
        caller: "ensureConversationInCache",
      }).queryKey,
    });

    retries++;
    if (retries < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  throw new Error("Failed to validate conversation in cache");
}
