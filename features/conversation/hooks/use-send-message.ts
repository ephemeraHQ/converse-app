import { useMutation } from "@tanstack/react-query"
import { getCurrentSender, getSafeCurrentSender } from "@/features/authentication/multi-inbox.store"
import {
  messageContentIsMultiRemoteAttachment,
  messageContentIsRemoteAttachment,
  messageContentIsText,
} from "@/features/conversation/conversation-chat/conversation-message/utils/conversation-message-assertions"
import { convertXmtpMessageToConvosMessage } from "@/features/conversation/conversation-chat/conversation-message/utils/convert-xmtp-message-to-convos-message"
import { getMessageWithType } from "@/features/conversation/conversation-chat/conversation-message/utils/get-message-with-type"
import {
  addMessageToConversationMessagesQuery,
  removeMessageToConversationMessages,
  replaceOptimisticMessageWithReal,
} from "@/features/conversation/conversation-chat/conversation-messages.query"
import { updateConversationInAllowedConsentConversationsQueryData } from "@/features/conversation/conversation-list/conversations-allowed-consent.query"
import {
  getOrFetchConversationQuery,
  updateConversationQueryData,
} from "@/features/conversation/queries/conversation.query"
import { sendXmtpConversationMessage } from "@/features/xmtp/xmtp-conversations/xmtp-conversation"
import { getXmtpConversationMessage } from "@/features/xmtp/xmtp-messages/xmtp-messages"
import {
  IXmtpConversationId,
  IXmtpConversationSendPayload,
  IXmtpDecodedMessageNativeContent,
  IXmtpMessageId,
} from "@/features/xmtp/xmtp.types"
import { captureError } from "@/utils/capture-error"
import { getTodayNs } from "@/utils/date"
import { getRandomId } from "@/utils/general"
import {
  IConversationMessageContent,
  IConversationMessageId,
  IConversationMessageMultiRemoteAttachmentContent,
  IConversationMessageRemoteAttachmentContent,
} from "../conversation-chat/conversation-message/conversation-message.types"
import { IConversationTopic } from "../conversation.types"

export type ISendMessageParams = {
  topic: IConversationTopic
  replyMessageId?: IConversationMessageId
  contents: IConversationMessageContent[] // Array because we can send text at same time as attachments for example
}

export async function sendMessage(args: ISendMessageParams) {
  const { replyMessageId, contents, topic } = args

  const currentSender = getSafeCurrentSender()

  const conversation = await getOrFetchConversationQuery({
    topic,
    clientInboxId: currentSender.inboxId,
    caller: "use-send-message",
  })

  if (!conversation) {
    throw new Error("Conversation not found when sending message")
  }

  // TODO: we need to make this cleaner...
  const combinedContentObj: {
    text?: string
    remoteAttachment?: IConversationMessageRemoteAttachmentContent
    multiRemoteAttachment?: IConversationMessageMultiRemoteAttachmentContent
  } = {}

  // TODO: we need to make this cleaner...
  for (const content of contents) {
    if (messageContentIsText(content)) {
      combinedContentObj.text = content.text
    } else if (messageContentIsRemoteAttachment(content)) {
      combinedContentObj.remoteAttachment = content
    } else if (messageContentIsMultiRemoteAttachment(content)) {
      combinedContentObj.multiRemoteAttachment = content
    }
  }

  // TODO: we need to make this cleaner...
  const combinedContent = combinedContentObj as IXmtpConversationSendPayload

  let sentXmtpMessageId: IXmtpMessageId | null = null

  if (replyMessageId) {
    // Send as a reply
    sentXmtpMessageId = await sendXmtpConversationMessage({
      clientInboxId: currentSender.inboxId,
      conversationId: conversation.id as unknown as IXmtpConversationId,
      content: {
        reply: {
          reference: replyMessageId,
          content: combinedContent as IXmtpDecodedMessageNativeContent,
        },
      },
    })
  } else {
    // Send as a regular message
    sentXmtpMessageId = await sendXmtpConversationMessage({
      clientInboxId: currentSender.inboxId,
      conversationId: conversation.id as unknown as IXmtpConversationId,
      content: combinedContent,
    })
  }

  if (!sentXmtpMessageId) {
    throw new Error(`Couldn't send message`)
  }

  const sentXmtpMessage = await getXmtpConversationMessage({
    messageId: sentXmtpMessageId,
    clientInboxId: currentSender.inboxId,
  })

  // Not supposed to happen but just in case
  if (!sentXmtpMessage) {
    captureError(new Error(`Couldn't get the full xmtp message after sending`))
    return {
      messageId: sentXmtpMessageId,
    }
  }

  return {
    messageId: sentXmtpMessageId,
    message: convertXmtpMessageToConvosMessage(sentXmtpMessage),
  }
}

export function useSendMessage() {
  const mutation = useMutation({
    mutationFn: sendMessage,
    onMutate: (variables) => {
      const { topic, contents } = variables

      const currentSender = getCurrentSender()!

      const tempMessageId = getRandomId() as IConversationMessageId

      // Create a properly typed content object for the optimistic update
      const combinedContent: {
        text?: string
        remoteAttachment?: IConversationMessageRemoteAttachmentContent
        multiRemoteAttachment?: IConversationMessageMultiRemoteAttachmentContent
      } = {}

      for (const content of contents) {
        if (messageContentIsText(content)) {
          combinedContent.text = content.text
        } else if (messageContentIsRemoteAttachment(content)) {
          combinedContent.remoteAttachment = content
        } else if (messageContentIsMultiRemoteAttachment(content)) {
          combinedContent.multiRemoteAttachment = content
        }
      }

      const optimisticMessage = getMessageWithType({
        baseMessage: {
          id: tempMessageId,
          sentNs: getTodayNs(),
          status: "sending",
          topic,
          senderInboxId: currentSender.inboxId,
        },
        content: combinedContent as IConversationMessageContent,
      })

      addMessageToConversationMessagesQuery({
        clientInboxId: currentSender.inboxId,
        topic,
        message: optimisticMessage,
      })

      updateConversationQueryData({
        clientInboxId: currentSender.inboxId,
        topic,
        conversationUpdate: {
          lastMessage: optimisticMessage,
        },
      })

      updateConversationInAllowedConsentConversationsQueryData({
        clientInboxId: currentSender.inboxId,
        topic,
        conversationUpdate: {
          lastMessage: optimisticMessage,
        },
      })

      return {
        tempMessageId,
      }
    },
    onSuccess: async (result, variables, context) => {
      const currentSender = getSafeCurrentSender()

      if (result.message) {
        replaceOptimisticMessageWithReal({
          tempId: context.tempMessageId,
          topic: variables.topic,
          clientInboxId: currentSender.inboxId,
          realMessage: result.message,
        })
      }
    },
    onError: (error, variables, context) => {
      if (!context) {
        return
      }

      const currentSender = getSafeCurrentSender()

      removeMessageToConversationMessages({
        clientInboxId: currentSender.inboxId,
        topic: variables.topic,
        messageId: context?.tempMessageId,
      })

      // TODO: Revert last message of conversation and list
    },
  })

  return {
    sendMessage: mutation.mutateAsync,
    isSending: mutation.isPending,
    error: mutation.error,
  }
}
