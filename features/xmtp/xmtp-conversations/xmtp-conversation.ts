import { ConversationSendPayload } from "@xmtp/react-native-sdk/build/lib/types"
import { ISupportedXmtpCodecs } from "@/features/xmtp/xmtp-codecs/xmtp-codecs"
import { XMTP_MAX_MS_UNTIL_LOG_ERROR } from "@/features/xmtp/xmtp-logs"
import { IXmtpConversationWithCodecs } from "@/features/xmtp/xmtp.types"
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
    if (duration > XMTP_MAX_MS_UNTIL_LOG_ERROR) {
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
