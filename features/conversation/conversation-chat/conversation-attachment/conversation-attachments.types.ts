export type LocalAttachment = {
  mediaURI: string
  mimeType: string | undefined
  dimensions?: { width: number; height: number }
}

export type LocalAttachmentMetadata = {
  filename: string
  mimeType: string | undefined
  imageSize?: { width: number; height: number }
  mediaType: "IMAGE" | "UNSUPPORTED"
  mediaURL: string
  contentLength: number
}

export type UploadedRemoteAttachment = {
  url: string
  filename: string
  mimeType: string | undefined
  contentLength: number
  secret: string
  salt: string
  nonce: string
  contentDigest: string
}
