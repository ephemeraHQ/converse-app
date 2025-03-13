import {
  IXmtpConsentState,
  IXmtpConversationWithCodecs,
  IXmtpDmWithCodecs,
  IXmtpGroupWithCodecs,
  IXmtpInboxId,
} from "@features/xmtp/xmtp.types"
import { ConversationVersion } from "@xmtp/react-native-sdk"
import { ConversationSendPayload } from "@xmtp/react-native-sdk/build/lib/types"
import { config } from "@/config"
import { getXmtpClientByInboxId } from "@/features/xmtp/xmtp-client/xmtp-client.service"
import { ISupportedXmtpCodecs } from "@/features/xmtp/xmtp-codecs/xmtp-codecs"
import { captureError } from "@/utils/capture-error"
import { XMTPError } from "@/utils/error"

export async function sendXmtpConversationMessage(args: {
  conversation: IXmtpConversationWithCodecs
  content: ConversationSendPayload<ISupportedXmtpCodecs>
}) {
  const { conversation, content } = args

  const startTime = Date.now()

  try {
    const result = await conversation.send(content)

    const duration = Date.now() - startTime
    if (duration > config.xmtp.maxMsUntilLogError) {
      captureError(
        new XMTPError({
          error: new Error(
            `Sending message took ${duration}ms for conversation: ${conversation.topic}`,
          ),
        }),
      )
    }

    return result
  } catch (error) {
    throw new XMTPError({
      error,
      additionalMessage: `Failed to send message to conversation: ${conversation.topic}`,
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
