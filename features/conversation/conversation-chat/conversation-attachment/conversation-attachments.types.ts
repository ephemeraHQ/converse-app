import { IConversationAttachment } from "@/features/conversation/conversation-chat/conversation-message/conversation-message.types"

// TODO
export type LocalAttachment = {
  mediaURI: string
  mimeType: string | undefined
  dimensions?: { width: number; height: number }
}

// TODO
export type LocalAttachmentMetadata = {
  filename: string
  mimeType: string | undefined
  imageSize?: { width: number; height: number }
  mediaType: "IMAGE" | "UNSUPPORTED"
  mediaURL: string
  contentLength: number
}

export type IUploadedRemoteAttachment = IConversationAttachment
