import { NativeMessageContent } from "@xmtp/react-native-sdk"
import { IXmtpDecodedMessage, IXmtpInboxId } from "@/features/xmtp/xmtp.types"

export type IConvosMessageStatus = "sending" | "sent" | "error"

export type IConvosMessageContentType =
  | "text"
  | "reaction"
  | "readReceipt"
  | "groupUpdated"
  | "reply"
  | "remoteAttachment"
  | "staticAttachment"

export type IConvosMessage = {
  convosMessageId: string
  xmtpMessageId: IXmtpDecodedMessage["id"]
  status: IConvosMessageStatus
  senderInboxId: IXmtpInboxId
  sentNs: number
  type: IConvosMessageContentType
  content: NativeMessageContent // TODO
}

export type IConvosMessageId = IConvosMessage["convosMessageId"]
