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
  ensureConversationQueryData,
  getConversationQueryData,
  updateConversationQueryData,
} from "@/features/conversation/queries/conversation.query"
import {
  getXmtpConversationTopicFromXmtpId,
  sendXmtpConversationMessage,
} from "@/features/xmtp/xmtp-conversations/xmtp-conversation"
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
  IConversationMessageMultiRemoteAttachmentContent,
  IConversationMessageRemoteAttachmentContent,
} from "../conversation-chat/conversation-message/conversation-message.types"

export type ISendMessageParams = {
  xmtpConversationId: IXmtpConversationId
  replyXmtpMessageId?: IXmtpMessageId
  contents: IConversationMessageContent[] // Array because we can send text at same time as attachments for example
}

export async function sendMessage(args: ISendMessageParams) {
  const { replyXmtpMessageId, contents, xmtpConversationId } = args

  const currentSender = getSafeCurrentSender()

  const conversation = await ensureConversationQueryData({
    xmtpConversationId,
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

  if (replyXmtpMessageId) {
    // Send as a reply
    sentXmtpMessageId = await sendXmtpConversationMessage({
      clientInboxId: currentSender.inboxId,
      conversationId: conversation.xmtpId,
      content: {
        reply: {
          reference: replyXmtpMessageId,
          content: combinedContent as IXmtpDecodedMessageNativeContent,
        },
      },
    })
  } else {
    // Send as a regular message
    sentXmtpMessageId = await sendXmtpConversationMessage({
      clientInboxId: currentSender.inboxId,
      conversationId: conversation.xmtpId,
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
    onMutate: async (variables) => {
      const { xmtpConversationId, contents } = variables

      const currentSender = getCurrentSender()!

      // const deterministicMessageId = await generateDeterministicMessageId({
      //   content: getMessageContentStringValue(contents[0]),
      //   senderInboxId: currentSender.inboxId,
      //   xmtpConversationId,
      // })

      const randomMessageId = getRandomId() as IXmtpMessageId

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
          tempOptimisticId: randomMessageId,
          xmtpId: "" as IXmtpMessageId, // Will be set once we send the message and replace with the real
          xmtpTopic: getXmtpConversationTopicFromXmtpId(xmtpConversationId),
          sentNs: getTodayNs(),
          status: "sending",
          xmtpConversationId,
          senderInboxId: currentSender.inboxId,
        },
        content: combinedContent as IConversationMessageContent,
      })

      const previousConversation = getConversationQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId,
      })

      addMessageToConversationMessagesQuery({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId,
        message: optimisticMessage,
      })

      updateConversationQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId,
        conversationUpdate: {
          lastMessage: optimisticMessage,
        },
      })

      updateConversationInAllowedConsentConversationsQueryData({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId,
        conversationUpdate: {
          lastMessage: optimisticMessage,
        },
      })

      return {
        tmpMessageId: randomMessageId,
        previousConversation,
      }
    },
    onSuccess: async (result, variables, context) => {
      const currentSender = getSafeCurrentSender()

      if (result.message) {
        replaceOptimisticMessageWithReal({
          tmpId: context.tmpMessageId,
          xmtpConversationId: variables.xmtpConversationId,
          clientInboxId: currentSender.inboxId,
          realMessage: result.message,
        })
      }
    },
    onError: (_, variables, context) => {
      if (!context) {
        return
      }

      const currentSender = getSafeCurrentSender()

      removeMessageToConversationMessages({
        clientInboxId: currentSender.inboxId,
        xmtpConversationId: variables.xmtpConversationId,
        messageId: context?.tmpMessageId,
      })

      if (context.previousConversation) {
        // Revert last message of conversation and list
        updateConversationQueryData({
          clientInboxId: currentSender.inboxId,
          xmtpConversationId: variables.xmtpConversationId,
          conversationUpdate: {
            lastMessage: context.previousConversation?.lastMessage,
          },
        })

        // Revert updated conversation
        updateConversationInAllowedConsentConversationsQueryData({
          clientInboxId: currentSender.inboxId,
          xmtpConversationId: variables.xmtpConversationId,
          conversationUpdate: {
            lastMessage: context.previousConversation.lastMessage,
          },
        })
      }
    },
  })

  return {
    sendMessage: mutation.mutateAsync,
    isSending: mutation.isPending,
    error: mutation.error,
  }
}
