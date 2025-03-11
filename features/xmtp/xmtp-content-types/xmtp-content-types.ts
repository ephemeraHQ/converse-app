import { logger } from "@utils/logger"
import { MultiRemoteAttachmentCodec } from "@xmtp/react-native-sdk"
import { IXmtpDecodedMessage } from "@/features/xmtp/xmtp.types"
import { ObjectTyped } from "@/utils/object-typed"

export const contentTypesPrefixes = {
  text: "xmtp.org/text:",
  remoteAttachment: "xmtp.org/remoteStaticAttachment:",
  attachment: "xmtp.org/attachment:",
  reaction: "xmtp.org/reaction:",
  reply: "xmtp.org/reply:",
  readReceipt: "xmtp.org/readReceipt:",
  groupUpdated: "xmtp.org/group_updated:",
  multiRemoteAttachment: "xmtp.org/multiRemoteStaticAttachment:",
  // coinbasePayment: "coinbase.com/coinbase-messaging-payment-activity:",
  // transactionReference: "xmtp.org/transactionReference:",
}

export type IConvosContentType = keyof typeof contentTypesPrefixes

export function getMessageContentType(args: { message: IXmtpDecodedMessage }) {
  const { message } = args

  const contentType = message.contentTypeId

  if (!contentType) {
    logger.debug(`[getMessageContentType] Content type is undefined`)
    return undefined
  }

  const result = ObjectTyped.keys(contentTypesPrefixes).find((key) =>
    contentType.startsWith(contentTypesPrefixes[key]),
  )

  return result
}
