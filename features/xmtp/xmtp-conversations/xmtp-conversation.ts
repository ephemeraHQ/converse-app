import {
  IXmtpConsentState,
  IXmtpConversationId,
  IXmtpConversationSendPayload,
  IXmtpConversationTopic,
  IXmtpConversationWithCodecs,
  IXmtpDmWithCodecs,
  IXmtpGroupWithCodecs,
  IXmtpInboxId,
} from "@features/xmtp/xmtp.types"
import { ConversationVersion, sendMessage } from "@xmtp/react-native-sdk"
import { config } from "@/config"
import { getXmtpClientByInboxId } from "@/features/xmtp/xmtp-client/xmtp-client"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"

export async function sendXmtpConversationMessage(args: {
  clientInboxId: IXmtpInboxId
  conversationId: IXmtpConversationId
  content: IXmtpConversationSendPayload
}) {
  const { content, clientInboxId, conversationId } = args

  const client = await getXmtpClientByInboxId({
    inboxId: clientInboxId,
  })

  try {
    const startTime = Date.now()
    const result = await sendMessage(client.installationId, conversationId, content)
    const endTime = Date.now()

    const duration = endTime - startTime
    if (duration > config.xmtp.maxMsUntilLogError) {
      captureError(
        new XMTPError({
          error: new Error(
            `Sending message took ${duration}ms for conversation: ${conversationId}`,
          ),
        }),
      )
    }

    return result
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Failed to send message to conversation: ${conversationId}`,
    })
  }
}

export async function getXmtpConversations(args: {
  clientInboxId: IXmtpInboxId
  consentStates: IXmtpConsentState[]
  limit?: number
}) {
  const {
    clientInboxId,
    consentStates,
    limit = 9999, // All of them by default
  } = args

  const startTime = Date.now()

  try {
    const client = await getXmtpClientByInboxId({
      inboxId: clientInboxId,
    })

    const conversations = await client.conversations.list(
      {
        isActive: true,
        addedByInboxId: true,
        name: true,
        imageUrl: true,
        consentState: true,
        lastMessage: true,
        description: true,
      },
      limit,
      consentStates,
    )

    const duration = Date.now() - startTime

    if (duration > config.xmtp.maxMsUntilLogError) {
      captureError(
        new XMTPError({
          error: new Error(`Getting conversations took ${duration}ms for inbox: ${clientInboxId}`),
        }),
      )
    }

    return conversations
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Failed to get conversations for inbox: ${clientInboxId}`,
    })
  }
}

export function isXmtpConversationGroup(
  conversation: IXmtpConversationWithCodecs,
): conversation is IXmtpGroupWithCodecs {
  return conversation.version === ConversationVersion.GROUP
}

export function isXmtpConversationDm(
  conversation: IXmtpConversationWithCodecs,
): conversation is IXmtpDmWithCodecs {
  return conversation.version === ConversationVersion.GROUP
}

export const getXmtpConversationIdFromXmtpTopic = (xmtpTopic: IXmtpConversationTopic) => {
  return xmtpTopic
    .replace(CONVERSATION_TOPIC_PREFIX, "")
    .replace("/proto", "") as IXmtpConversationId
}

export function getXmtpConversationTopicFromXmtpId(xmtpId: IXmtpConversationId) {
  return `${CONVERSATION_TOPIC_PREFIX}/${xmtpId}/proto` as IXmtpConversationTopic
}

export const CONVERSATION_TOPIC_PREFIX = "/xmtp/mls/1/g-"
