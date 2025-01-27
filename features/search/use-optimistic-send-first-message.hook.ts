import { getCurrentAccount } from "@/data/store/accountsStore";
import { getCurrentAccountInboxId } from "@/hooks/use-current-account-inbox-id";
import { fetchConversationMessageQuery } from "@/queries/useConversationMessage";
import {
  addConversationMessageQuery,
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
  TextCodec,
} from "@xmtp/react-native-sdk";
import { useCallback } from "react";
import { getOrFetchConversation } from "@/queries/useConversationQuery";
import { generateGroupHashFromMemberIds } from "@/features/create-conversation/generate-group-hash-from-member-ids";
import {
  createGroupWithDefaultsByAccount,
  createConversationByAccount,
} from "@/utils/xmtpRN/conversations";
import { addConversationToConversationsQuery } from "@/queries/use-conversations-query";
import { setDmQueryData } from "@/queries/useDmQuery";
import { showSnackbar } from "@/components/Snackbar/Snackbar.service";
import { sentryTrackError } from "@/utils/sentry";
import { SupportedCodecsType } from "@/utils/xmtpRN/client.types";

export type ISendMessageParams = {
  topic: ConversationTopic;
  referencedMessageId?: MessageId;
  content:
    | { text: string; remoteAttachment?: RemoteAttachmentContent }
    | { text?: string; remoteAttachment: RemoteAttachmentContent };
};

export type ISendFirstMessageParams = Omit<ISendMessageParams, "topic">;

export async function sendMessage(args: ISendMessageParams) {
  const { referencedMessageId, content, topic } = args;
  const conversation = await getOrFetchConversation({
    topic,
    account: getCurrentAccount()!,
    caller: "use-send-message#sendMessage",
  });

  if (!conversation) {
    throw new Error("Conversation not found when sending message");
  }

  if (referencedMessageId) {
    return conversation.send({
      reply: {
        reference: referencedMessageId,
        content: content.remoteAttachment
          ? { remoteAttachment: content.remoteAttachment }
          : { text: content.text },
      },
    });
  }

  return conversation.send(
    content.remoteAttachment
      ? { remoteAttachment: content.remoteAttachment }
      : { text: content.text! }
  );
}

type IUseOptimisticSendFirstMessageParams = {
  members: string[];
};

type IOptimisticSendFirstMessageParams = {
  content: { text: string };
  tempTopic?: string;
};

export function useOptimisticSendFirstMessage({
  members,
}: IUseOptimisticSendFirstMessageParams) {
  const currentAccount = getCurrentAccount()!;
  const isGroup = members.length > 1;

  // Generate temp topic for groups before creation
  const tempTopic = isGroup
    ? generateGroupHashFromMemberIds(members)
    : undefined;

  const { mutateAsync: createConversationAsync } = useMutation({
    mutationFn: async () => {
      if (isGroup) {
        return createGroupWithDefaultsByAccount({
          account: currentAccount,
          peerEthereumAddresses: members,
        });
      }
      return createConversationByAccount(currentAccount, members[0]);
    },
    onSuccess: (newConversation) => {
      // todo remove temproary conversation by group hash
      addConversationToConversationsQuery({
        account: currentAccount,
        conversation: newConversation,
      });

      if (!isGroup) {
        setDmQueryData({
          account: currentAccount,
          peer: members[0],
          dm: newConversation as Dm<SupportedCodecsType>,
        });
      }
    },
  });

  const { mutateAsync: sendMessageAsync } = useMutation({
    mutationFn: async (args: {
      content: { text: string };
      conversationTopic: string;
    }) => {
      const conversation = await createConversationAsync();
      return sendMessage({
        topic: conversation.topic,
        content: args.content,
      });
    },
    onMutate: async (variables) => {
      if (!tempTopic && isGroup) {
        throw new Error("Temp topic required for group messages");
      }

      const generatedMessageId = getRandomId();
      const topic = tempTopic ?? ""; // For DMs, tempTopic is undefined but not needed

      const optimisticMessage: DecodedMessage = {
        id: generatedMessageId as MessageId,
        tempOptimisticId: generatedMessageId,
        contentTypeId: contentTypesPrefixes.text,
        sentNs: getTodayNs(),
        fallback: "new-message",
        deliveryStatus: "sending" as MessageDeliveryStatus,
        topic,
        senderInboxId: currentAccount,
        nativeContent: {},
        content: () => variables.content.text,
      };

      addConversationMessageQuery({
        account: currentAccount,
        topic,
        message: optimisticMessage,
      });

      return { generatedMessageId, tempTopic };
    },
    onSuccess: (messageId, variables, context) => {
      if (context?.generatedMessageId) {
        replaceOptimisticMessageWithReal({
          tempId: context.generatedMessageId,
          topic: context.tempTopic ?? "", // Will be replaced with real topic
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
      if (context?.tempTopic) {
        refetchConversationMessages({
          account: currentAccount,
          topic: context.tempTopic,
          caller: "useOptimisticSendFirstMessage#onError",
        }).catch(captureErrorWithToast);
      }
      sentryTrackError(error);
    },
  });

  const sendMessage = useCallback(
    async (params: IOptimisticSendFirstMessageParams) => {
      try {
        await sendMessageAsync({
          content: params.content,
          conversationTopic: params.tempTopic ?? "", // Will be real topic after creation
        });
        return { success: true, tempTopic };
      } catch (error) {
        showSnackbar({
          message: isGroup
            ? "Failed to create group"
            : "Failed to start conversation",
        });
        return { success: false, tempTopic };
      }
    },
    [sendMessageAsync, isGroup, tempTopic]
  );

  return {
    sendMessage,
    tempTopic,
    isLoading: createConversationAsync.isPending,
    isError: createConversationAsync.isError,
  };
}
